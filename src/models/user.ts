import { ObjectId } from "mongodb";

export class User {
    _id: ObjectId = new ObjectId();
    username: string = '';
    password: string = '';
    email: string = '';
    role: string = '';  // 1: professor  2: student
    major: string = '';
    minor: string = '';
    department: string = '';
    title: string = '';
    grade: string = '';
    gender: string = '';
    birthdate: Date = new Date();
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
}

