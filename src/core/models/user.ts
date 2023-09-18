import { ObjectId } from "mongodb";
import { getDB } from "../config/utils/mongohelper";

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

//get all users, ignore this for now
export const getAllUsers = async (): Promise<User[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        let db = await getDB();
        const collection = db.collection<User>("users");
        const result = await collection.find({}).toArray();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };
  