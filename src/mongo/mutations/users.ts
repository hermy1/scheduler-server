import { compareSync, genSaltSync, hashSync } from "bcrypt";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { MongoFindError, MongoInsertError, MongoUpdateError } from "../../core/errors/mongo";
import { User } from "../../models/user";
import { UserRole } from "../../models/user";
import { getAllStudents, getUserbyUsername } from "../queries/users";

export const insertNewUser = async (
  username: string,
  password: string,
  role: UserRole,
  email: string,
  major: string,
  minor: string,
  department: string,
  grade: string,
  gender: string,
  title: string,
  birthdate: Date, avatar:string, firstName:string,lastName:string
): Promise<User> => {
  const db = await getDB();
  const collection = db.collection<User>("users");
  const user = new User();
  user.username = username;
  user.password = password;
  user.role = role as UserRole;
  user.email = email;
  user.major = major;
  user.minor = minor;
  user.department = department;
  user.gender = gender;
  user.title = title;
  user.grade = grade;
  user.avatar = avatar;
  user.firstName = firstName;
  user.lastName = lastName;
  user.birthdate = birthdate;
  user.createdAt = new Date();
  user.updatedAt = new Date();

  try {
    const result = await collection.insertOne(user);
    if (result.acknowledged) {
      user._id = result.insertedId;
      return user;
    } else {
      throw new MongoInsertError("Error inserting user");
    }
  } catch (err) {
    console.error(err);
    throw new Error("Error inserting user");
  }
};

export const resetPassword = async (id:string, newPassword1:string ): Promise<boolean> => {
  return new Promise( async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const user = await collection.findOne({ _id:ensureObjectId(id)});
      if (user) {
        const salt = genSaltSync(10);      
        const hashPassword = hashSync(newPassword1, salt);
        let updateuser = await collection.updateOne({_id:ensureObjectId(id)},{$set: {password:hashPassword}});
        if (updateuser.acknowledged) {
          resolve(true);
        } else {
          throw new MongoFindError("Something went wrong when finding user by id");
        }
      } else {
        throw new MongoUpdateError("Something went wrong when updating user's password");
      }
    } catch (err) {
      reject(err);
    }
  });
};

export const changePassword = async (username:string,id:string, oldPassword:string, newPassword:string ): Promise<boolean> => {
  return new Promise( async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const user = await collection.findOne({ _id:ensureObjectId(id)});
      if (user) {
        const salt = genSaltSync(10);      
        const hashPassword = hashSync(newPassword, salt);
        let currentPassword = (await getUserbyUsername(username)).password;
        let compare = await compareSync(oldPassword, currentPassword);
        if (compare){
          let updateuser = await collection.updateOne({_id:ensureObjectId(id)},{$set: {password:hashPassword}});
          if (updateuser.acknowledged) {
            resolve(true);
          } else {
            throw new MongoUpdateError("Something went wrong when changing user's password");
        } }else{
          throw new MongoFindError("Something went wrong when changing user's password");
        }}

        
    } catch (err) {
      reject(err);
    }
  });
};