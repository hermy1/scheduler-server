import { ObjectId } from 'mongodb';
export class Advisor{
    _id: ObjectId = new ObjectId();
    professorId: ObjectId = new ObjectId();
    //students is an array of ObjectIds
    students: ObjectId[] = [];
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
}