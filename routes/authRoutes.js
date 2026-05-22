import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AuthorizationCode from '../models/AuthorizationCode.js';
import authMiddleware from '../middleware/authMiddleware.js';
import OAuthClient from '../models/OAuthClient.js';

const router = express.Router();

router.get('/authorize',authMiddleware, async(req, res)=>{
  try {
    const {client_id, redirect_uri, scope} = req.query;
    const client = await OAuthClient.findOne({clientId: client_id});
    if(!client){
      return res.status(404).json({message: "Client not found"});
    }
    if(!client.redirectUris.includes(redirect_uri)){
      return res.status(400).json({message: "Invalid redirect URI"});
    }
    const code = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await AuthorizationCode.create({code, userId: req.userId, scope, expiresAt});
    res.redirect(`${redirect_uri}?code=${code}`);
  } catch (error) {
    res.status(500).json({message: error.message});
  }
});

router.post('/token', async(req, res)=>{
  try {
    const {code, client_id, client_secret} = req.body;
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
    const user = await User.findById(authorizationCode.userId);
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    const accessToken = jwt.sign({id: user._id, role: user.role, scope: authorizationCode.scope}, process.env.JWT_SECRET, {expiresIn: "15m"});
    const refreshToken = jwt.sign({id: user._id, role: user.role, scope: authorizationCode.scope}, process.env.REFRESH_SECRET, {expiresIn: "7d"});
    let idToken = null;
    if(authorizationCode.scope.split(" ").includes("openid")){
      idToken = jwt.sign({sub: user._id, role: user.role, scope: authorizationCode.scope}, process.env.JWT_SECRET, {expiresIn: "15m"});
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
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({email, password: hashedPassword, role: role});
    res.status(201).json({message: "User registered successfully"});
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

export default router;