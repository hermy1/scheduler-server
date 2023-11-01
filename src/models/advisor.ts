import { ObjectId } from 'mongodb';
/*
This collection will represent the advisor-student relationships that professors can add students to.
*/
export class Advisor{
    _id: ObjectId = new ObjectId();
    professorId: ObjectId = new ObjectId();
    //students is an array of ObjectIds
    students: ObjectId[] = [];
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
}


