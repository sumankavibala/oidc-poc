import { getDb } from "../config/db.js";

export const getUsersCollection = () => getDb().collection("users");
