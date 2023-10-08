import { ObjectId } from "mongodb";

//notification
export interface Notification {
    _id: ObjectId;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}