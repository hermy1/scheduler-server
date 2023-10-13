import { getDB } from "../../core/config/utils/mongohelper";
import { MongoInsertError } from "../../core/errors/mongo";
import { User } from "../../models/user";
import { UserRole } from "../../models/user";

export const insertNewUser = async (
  username: string,
  password: string,
  role: string,
  email: string,
  major: string,
  minor: string,
  department: string,
  grade: string,
  gender: string,
  title: string,
  birthdate: Date
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