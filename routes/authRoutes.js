import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AuthorizationCode from '../models/AuthorizationCode.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/authorize', authMiddleware, async(req, res)=>{
  try {
    const code = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await AuthorizationCode.create({code, userId: req.userId, expiresAt});
    res.status(201).json({code, message: "Authorization code generated"});
  ``} catch (error) {
    console.log('error inside authorization route-->',error)
    res.status(500).json({message: error.message});
  }
});

router.post('/token', async(req, res)=>{
  try {
    const {code} = req.body;
    console.log('code-->',code);
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
    const user = await User.findById(authorizationCode.userId);
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    const accessToken = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "15m"});
    const refreshToken = jwt.sign({id: user._id, role: user.role}, process.env.REFRESH_SECRET, {expiresIn: "7d"});
    await AuthorizationCode.deleteOne({code});
    res.json({message: "Token generated successfully", accessToken, refreshToken});
  } catch (error) {
    console.log('error-->',error)
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
  console.log('asdfg')
  try {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    console.log('user-->>',user);
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
    console.log('error-->',error)
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
    console.log('error-->',error)
    return res.status(500).json({message: "Token is not valid"});
  }
})

export default router;