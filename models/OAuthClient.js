import { getDb } from "../config/db.js";

export const getOAuthClientsCollection = () => getDb().collection("oauth_clients");