import { ObjectId } from "mongodb";

export default class User {
    _id: ObjectId = new ObjectId();
    username: string = '';
    password: string = '';
    email: string = '';
    //TODO: 0: admin, 1: professor  2: student?
    role: string = '';
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