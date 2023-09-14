import { MongoClient,Db, ObjectId } from "mongodb";
import config  from "../index";

let  mongonInstance: Db;

export const getDB = async (): Promise <Db> => {
    if(!mongonInstance) {
        const connectionString = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${config.mongo.database}`;
        const mongo = await MongoClient.connect(connectionString);
        mongonInstance = mongo.db(config.mongo.database);
        console.log("MongoDB connected");
    }
    return mongonInstance;
}