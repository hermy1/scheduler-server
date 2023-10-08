import { ObjectId } from "mongodb";

//settings
export interface Setting {
    _id: ObjectId;
    notification: boolean;
    createdAt: Date;
    updatedAt: Date;
}