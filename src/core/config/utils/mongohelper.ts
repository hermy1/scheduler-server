import { MongoClient, Db, ObjectId } from "mongodb";
import config from "../index";

let mongonInstance: Db;

export const getDB = async (): Promise<Db> => {
  if (!mongonInstance) {
    const connectionString = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`;
    const mongo = await MongoClient.connect(connectionString);
    mongonInstance = mongo.db(config.mongo.database);
    console.log("MongoDB connected");
  }
  return mongonInstance;
};

// ensure object id
export const ensureObjectId = (id: string | ObjectId): ObjectId => {
  if (typeof id === "string") {
    return new ObjectId(id);
  }

  return id;
};
