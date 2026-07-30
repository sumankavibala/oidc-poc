import { MongoClient, ServerApiVersion } from "mongodb";

let dbClient = null;
let db = null;

const dbConnection = async () => {
  if (db) return db;
  try {
    const uri = process.env.MONGODB_URI || "mongodb+srv://suman-bala:Suman%40123@cluster0.ul6en5f.mongodb.net/?appName=Cluster0";
    dbClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await dbClient.connect();
    db = dbClient.db();
    console.log("MongoDB connected");
    return db;
  } catch (error) {
    console.log("MongoDB connection error:", error);
    throw error;
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized. Call dbConnection first.");
  }
  return db;
};

export default dbConnection;
