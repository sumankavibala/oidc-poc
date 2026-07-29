import mongoose from "mongoose";

const authorizationCodeSchema = new mongoose.Schema({
  code: String,
  userId: String,
  scope: String,
  expiresAt: Date,
  codeChallenge: String,
  codeChallengeMethod: String,
  nonce: String,
});

export default mongoose.model(
  "AuthorizationCode",
  authorizationCodeSchema
);
