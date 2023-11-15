import { ObjectId } from "mongodb";

/*
 This collection will store professors' available time slots for appointments.
*/
export interface Availability {
    _id: ObjectId;
    professorId: ObjectId;
    weekDay: string; //monday, tuesday etc
    date: Date;
    // 30 minute intervals 
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    updatedAt: Date;
}