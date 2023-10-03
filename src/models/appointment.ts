import {IntegerType, ObjectId} from "mongodb"

// add stands for additonal

export class Appointment{
    _id: ObjectId = new ObjectId();
    studentId: IntegerType = 0;
    professorId: IntegerType = 0;
    addProfessorId: IntegerType = 0;
    time: Date = new Date();
    date: Date = new Date();
    message: string = '';
    location: string = '';
    status: string = '';
    addStatus: string = '';
    summary: string = '';

}