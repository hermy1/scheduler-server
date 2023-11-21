import { ObjectId } from "mongodb";
import { Notification } from "../../models/notification";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { MongoInsertError, MongoUpdateError } from "../../core/errors/mongo";

export const createNotification = async (userId: string|ObjectId,title: string,description: string, ): Promise<Notification> => {
    const db = await getDB();
    const collection = db.collection<Notification>("notifications");
    const notification = new Notification();
    notification.userId = ensureObjectId(userId);
    notification.title = title;
    notification.description = description;
    notification.createdAt = new Date();
    notification.updatedAt = new Date();
  
    try {
      const result = await collection.insertOne(notification);
      if (result.acknowledged) {
        notification._id = result.insertedId;
        return notification;
      } else {
        throw new MongoInsertError("Error inserting notification");
      }
    } catch (err) {
      console.error(err);
      throw new Error("Error inserting notification");
    }
  };

  export const readNotification = async (notificationId:string| ObjectId):Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
       
          let db = await getDB();
          let collection = db.collection<Notification>('notifications');
          let update = await collection.updateOne({ _id: ensureObjectId(notificationId) },{ $set: { read: true} });
          if( update.acknowledged){
            resolve(true);
          } else {
            throw new MongoUpdateError("Error updating notification");

          }                


      } catch (err) {
        reject(err);
      }
    });
  }