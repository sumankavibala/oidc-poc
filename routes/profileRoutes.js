import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import authorize from '../middleware/authorize.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/profile', async(req, res)=> {
  try {
    const user = await User.findById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
})

router.get('/admin', authorize(['admin']), async(req, res)=> {
  try {
    const user = await User.findById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
});

router.get('/user', authorize(['user']), async(req, res)=> {
  try {
    const user = await User.findById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
})

export default router;