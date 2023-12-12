import { ObjectId } from "mongodb";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { Notification } from "../../models/notification";
import { MongoFindError } from "../../core/errors/mongo";

export const allNotifications = async (id: string | ObjectId): Promise<Notification[]> => {
  try {
    const db = await getDB();
    const collection = await db.collection<Notification>('notifications');
    
    // Use ensureObjectId(id) to convert the id to ObjectId if needed
    let results = await collection
      .find({ userId: ensureObjectId(id) })
      .sort({ createdAt: -1 }) // Sorting in descending order based on createdAt field
      .limit(10) // Limiting the number of results to 10
      .toArray();

    return results;
  } catch (err) {
    throw err;
  }
};


  export const getNotification = async (id:string|ObjectId): Promise<Notification[]> => {
    try {
      const db = await getDB();
      const collection = await db.collection<Notification>('notifications');
    let results = collection.find({_id: ensureObjectId(id)}).toArray();    
  if(results){
  
      return results;
  }else {
    throw new MongoFindError("Could not find notification");
  }
    } catch (err) {
      throw err;
    }
  };