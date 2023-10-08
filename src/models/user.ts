import { ObjectId } from "mongodb";

//user Role
export enum UserRole {
    Student = "student",
    Professor = "professor"
}

export class User {
    _id: ObjectId = new ObjectId();
    username: string = '';
    password: string = '';
    email: string = '';
    role: UserRole = UserRole.Student || UserRole.Professor;
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

