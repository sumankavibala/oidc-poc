import express from "express";
import { ObjectId } from "mongodb";
import authMiddleware from "../middleware/authMiddleware.js";
import { getUsersCollection } from "../models/User.js";
import authorize from '../middleware/authorize.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/profile', async(req, res)=> {
  try {
    const user = await getUsersCollection().findOne({ _id: new ObjectId(req.userId) });
    res.json(user);
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
})

router.get('/admin', authorize(['admin']), async(req, res)=> {
  try {
    const user = await getUsersCollection().findOne({ _id: new ObjectId(req.userId) });
    res.json(user);
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
});

router.get('/user', authorize(['user']), async(req, res)=> {
  try {
    const user = await getUsersCollection().findOne({ _id: new ObjectId(req.userId) });
    res.json(user);
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
})

export default router;