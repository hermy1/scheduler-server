import { ObjectId } from "mongodb";

/*
This collection for codes will be used to verify users' emails and reset passwords.
*/
export class Code {
    _id: ObjectId = new ObjectId();
    code: string = '';
    createdAt: Date = new Date();
    userId: ObjectId = new ObjectId();
}