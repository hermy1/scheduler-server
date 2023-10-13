import { ObjectId } from 'mongodb';
export class Advisor{
    _id: ObjectId = new ObjectId();
    studentId: ObjectId = new ObjectId();
    professorId: ObjectId = new ObjectId();
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
}