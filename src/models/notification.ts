import { ObjectId } from "mongodb";

//notification
export class Notification {
    _id: ObjectId= new ObjectId;
    title: string = "";
    description: string = "";
    userId: ObjectId = new ObjectId; //id of who to send the notification to
    read: boolean = false; //true if the user read the notification, false if not
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
}