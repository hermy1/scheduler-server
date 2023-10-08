import { getDB } from "../../core/config/utils/mongohelper";
import { User,UserRole } from "../../models/user";
import { MongoFindError } from "../../core/errors/mongo";

//get all users, ignore this for now
// export const getAllUsers = async (): Promise<User[]> => {
//     return new Promise(async (resolve, reject) => {
//       try {
//         let db = await getDB();
//         const collection = db.collection<User>("users");
//         const result = await collection.find({}).toArray();
//         resolve(result);
//       } catch (err) {
//         reject(err);
//       }
//     });
//   };
//get user by username
export const getUserbyUsername = async (username: string): Promise<User> => {
  return new Promise (async (resolve,reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({ username: username });
      if(result && result.username && result.username.length > 0){
        resolve(result);
      } else {
        reject(new MongoFindError("User not found"));
      }
    } catch (err) {}
  })
};

//check if user exisits by username
export const checkIfUserExists = async (username: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({ username: username });
      if (result && result.username && result.username.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (err) {
      reject(err);
    }
  });
};

//get all students
export const getAllStudents = async (): Promise<User[]> => {
  return new Promise(async (resolve, reject)=> {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.find({ role: UserRole.Student }).toArray();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  })
};

//get all professors
export const getAllProfessors = async (): Promise<User[]> => {
  return new Promise( async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.find({ role: UserRole.Professor }).toArray();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

