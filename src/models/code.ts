import { ObjectId } from "mongodb";

export class Code {
    _id: ObjectId = new ObjectId();
    code: string = '';
    createdAt: Date = new Date();
    userId: ObjectId = new ObjectId();
}