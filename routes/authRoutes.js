import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AuthorizationCode from '../models/AuthorizationCode.js';
import authMiddleware from '../middleware/authMiddleware.js';
import OAuthClient from '../models/OAuthClient.js';
import { privateKey } from '../config/key.js';
import { createCodeChallenge } from '../utils/pkce.js';

const router = express.Router();

router.get('/authorize', async(req, res)=>{
  try {
    const {client_id, redirect_uri, scope, token, code_challenge, code_challenge_method, nonce } = req.query;
    if (!code_challenge) {
      return res.status(400).json({
          error: "code_challenge is required"
      });
    }
    if (!code_challenge_method) {
      return res.status(400).json({
          error: "code_challenge_method is required"
      });
    }
    if (code_challenge_method !== "S256") {
      return res.status(400).json({
          error: "Unsupported code_challenge_method"
      });
    }
    if (!nonce) {
      return res.status(400).json({
        error: "nonce is required"
      });
    }
    let userId = req.userId;
    if (!userId && token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        return res.status(401).json({message: "Invalid token provided in authorize request"});
      }
    }
    const client = await OAuthClient.findOne({clientId: client_id});
    if(!client){
      return res.status(404).json({message: "Client not found"});
    }
    if(!client.redirectUris.includes(redirect_uri)){
      return res.status(400).json({message: "Invalid redirect URI"});
    }
    const code = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await AuthorizationCode.create({code, userId: userId, scope, expiresAt, codeChallenge: code_challenge, codeChallengeMethod: code_challenge_method, nonce: nonce });
    res.redirect(`${redirect_uri}?code=${code}`);
  } catch (error) {
    res.status(500).json({message: error.message});
  }
});

router.post('/token', async(req, res)=>{
  try {
    const {code, client_id, client_secret, code_verifier} = req.body;
    if(!code){
      return res.status(400).json({message: "Authorization code is required"});
    }
    const authorizationCode = await AuthorizationCode.findOne({code});
    if(!authorizationCode){
      return res.status(404).json({message: "Authorization code not found"});
    }
    if(authorizationCode.expiresAt < new Date()){
      return res.status(400).json({message: "Authorization code expired"});
    }
    const client = await OAuthClient.findOne({clientId: client_id});
    if(!client){
      return res.status(404).json({message: "Client not found"});
    }
    if(client.clientSecret !== client_secret){
      return res.status(401).json({message: "Invalid client secret"});
    }
    if(!code_verifier) {
      return res.status(400).json({message: "code_verifier is required"});
    }
    const user = await User.findById(authorizationCode.userId);
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    const authCode = await AuthorizationCode.findOne({code});
    if(!authCode){
      return res.status(404).json({message: "Authorization code not found"});
    }

    const calculateChallenge = await createCodeChallenge(code_verifier);
    if(calculateChallenge !== authCode.codeChallenge) {
      return res.status(400).json({message: "Invalid code challenge"});
    }
    const accessToken = jwt.sign({id: user._id, role: user.role, scope: authorizationCode.scope}, process.env.JWT_SECRET, {expiresIn: "15m"});
    const refreshToken = jwt.sign({id: user._id, role: user.role, scope: authorizationCode.scope}, process.env.REFRESH_SECRET, {expiresIn: "7d"});
    let idToken = null;
    if (authorizationCode.scope.split(" ").includes("openid")) {
      idToken = jwt.sign(
        { sub: user._id, role: user.role, scope: authorizationCode.scope, nonce: authorizationCode.nonce },
        privateKey,
        {
          expiresIn: "15m",
          algorithm: "RS256",
          header: {
            kid: "key-1",
          },
        },
      );
    }
    await AuthorizationCode.deleteOne({code});
    res.json({message: "Token generated successfully", accessToken, refreshToken, idToken});
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
});

router.post('/register', async(req, res)=>{
  try {
    const {email, password, role} = req.body;
    const user = await User.findOne({email});
    if(user){
      return res.status(400).json({message: "User already exists"});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = await User.create({email, password: hashedPassword, role: role});
    res.status(201).json({message: "User registered successfully", ok: true, userData});
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
});

router.post('/login',async(req, res)=> {
  try {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid){
      return res.status(401).json({message: "Invalid password"});
    }
    // Generate JWT token
    const token = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "1h"}, {jwtid: crypto.randomUUID()});
    const refreshToken = jwt.sign({id: user._id, role: user.role}, process.env.REFRESH_SECRET, {expiresIn: "7d"}, {jwtid: crypto.randomUUID()});
    res.json({message: "User logged in successfully", token, refreshToken});
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
})

router.post('/refresh', async(req, res)=> {
  try {
    const refreshToken = req.body.refreshToken;
    if(!refreshToken){
      return res.status(401).json({message: "Refresh token is required"});
    }
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decodedToken.id);
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    const newToken = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "15m"}, {jwtid: crypto.randomUUID()});
    const newRefreshToken = jwt.sign({id: user._id, role: user.role}, process.env.REFRESH_SECRET, {expiresIn: "7d"}, {jwtid: crypto.randomUUID()});
    res.json({message: "Token refreshed successfully", token: newToken, refreshToken: newRefreshToken});
  } catch (error) {
    return res.status(500).json({message: "Token is not valid"});
  }
})

router.get('/userinfo',authMiddleware, async(req, res)=> {
  try {
    const user = await User.findById(req.userId);
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    res.json({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
});

export default router;
