import { getDb } from "../config/db.js";

export const getAuthorizationCodesCollection = () => getDb().collection("authorization_codes");
