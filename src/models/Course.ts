//classes model 
import { ObjectId } from "mongodb";
/*
 This collection will represent the Courses that professors can add students to.
 class name is not used because of the name conflict with the class keyword in javascript
*/

export interface Course {
    _id: ObjectId;
    courseCode: string;
    courseName: string;
    courseDescription: string;
    courseDepartment: string;
    professorId: ObjectId;
    //students is an array of ObjectIds
    students: ObjectId[];
    // schudule: string; MWF 10:00-11:00
    createdAt: Date;
    updatedAt: Date;
}