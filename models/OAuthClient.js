import mongoose from "mongoose";

const oauthClientSchema = new mongoose.Schema({
  clientId: String,
  name: String,
  redirectUris: [String]
});

export default mongoose.model("OAuthClient", oauthClientSchema);