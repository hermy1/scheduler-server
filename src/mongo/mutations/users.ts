import { compareSync, genSaltSync, hashSync } from "bcrypt";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import {
  MongoFindError,
  MongoInsertError,
  MongoUpdateError,
} from "../../core/errors/mongo";
import { User } from "../../models/user";
import { UserRole } from "../../models/user";
import { getAllStudents, getUserbyUsername } from "../queries/users";
import { ObjectId } from "mongodb";

export const insertNewUser = async (
  username: string,
  email: string,
  role: UserRole,
  firstName: string,
  lastName: string,
  password: string,
): Promise<User> => {
  const db = await getDB();
  const collection = db.collection<User>("users");
  const user = new User();
  user.username = username;
  user.email = email;
  user.role = role as UserRole;
  user.firstName = firstName;
  user.lastName = lastName;
  user.password = password;
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

export const resetPassword = async (
  id: string,
  newPassword1: string
): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const user = await collection.findOne({ _id: ensureObjectId(id) });
      if (user) {
        const salt = genSaltSync(10);
        const hashPassword = hashSync(newPassword1, salt);
        let updateuser = await collection.updateOne(
          { _id: ensureObjectId(id) },
          { $set: { password: hashPassword } }
        );
        if (updateuser.acknowledged) {
          resolve(true);
        } else {
          throw new MongoFindError(
            "Something went wrong when finding user by id"
          );
        }
      } else {
        throw new MongoUpdateError(
          "Something went wrong when updating user's password"
        );
      }
    } catch (err) {
      reject(err);
    }
  });
};

export const changePassword = async (
  username: string,
  id: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const user = await collection.findOne({ _id: ensureObjectId(id) });
      if (user) {
        const salt = genSaltSync(10);
        const hashPassword = hashSync(newPassword, salt);
        let currentPassword = (await getUserbyUsername(username)).password;
        let compare = await compareSync(oldPassword, currentPassword);
        if (compare) {
          let updateuser = await collection.updateOne(
            { _id: ensureObjectId(id) },
            { $set: { password: hashPassword } }
          );
          if (updateuser.acknowledged) {
            resolve(true);
          } else {
            throw new MongoUpdateError(
              "Something went wrong when changing user's password"
            );
          }
        } else {
          throw new MongoFindError(
            "Something went wrong when changing user's password"
          );
        }
      }
    } catch (err) {
      reject(err);
    }
  });
};

export const updateUserInfo = async (user: User): Promise<User> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const existingUser = await collection.findOne({
        _id: ensureObjectId(user._id),
      });
      if (existingUser) {
        let updateuser = await collection.updateOne(
          { _id: ensureObjectId(user._id) },
          { $set: user }
        );
        if (updateuser.acknowledged) {
          resolve(user);
        } else {
          throw new MongoUpdateError(
            "Something went wrong when updating user's info"
          );
        }
      } else {
        throw new MongoFindError(
          "Something went wrong when finding user by id"
        );
      }
    } catch (err) {
      reject(err);
    }
  });
};
