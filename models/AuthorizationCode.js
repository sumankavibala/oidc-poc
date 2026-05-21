import mongoose from "mongoose";

const authorizationCodeSchema = new mongoose.Schema({
  code: String,
  userId: String,
  expiresAt: Date,
});

export default mongoose.model(
  "AuthorizationCode",
  authorizationCodeSchema
);
