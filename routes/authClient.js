import express from "express";
import OAuthClient from "../models/OAuthClient.js";

const router = express.Router();

router.get('/client', async(req, res)=> {
  try {
    const clients = await OAuthClient.find();
    res.json(clients);
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
});

router.post('/addClient', async(req, res)=> {
  try {
    const {clientId, name} = req.body;
    // const client = new OAuthClient({clientId, name});
    // await client.save();
    const client = await OAuthClient.create({clientId, name});
    res.json(client);
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
});

export default router;