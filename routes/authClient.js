import express from "express";
import { getOAuthClientsCollection } from "../models/OAuthClient.js";

const router = express.Router();

router.get('/client', async(req, res)=> {
  try {
    const clients = await getOAuthClientsCollection().find().toArray();
    res.json(clients);
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
});

router.post('/addClient', async(req, res)=> {
  try {
    const {clientId, clientSecret, name, redirectUris} = req.body;
    const clientData = {clientId, clientSecret, name, redirectUris};
    const result = await getOAuthClientsCollection().insertOne(clientData);
    res.json({ _id: result.insertedId, ...clientData });
  } catch (error) {
    res.status(500).json({message: "Internal server error"});
  }
});

export default router;