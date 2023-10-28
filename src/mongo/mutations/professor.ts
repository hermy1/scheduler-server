import { ObjectId } from "mongodb";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { MongoFindError, MongoInsertError, MongoUpdateError } from "../../core/errors/mongo";
import {Course} from "../../models/Course";
import { User } from "../../models/user";

export const insertNewCourse = async (courseCode:string, courseName:string, courseDescription:string, courseDepartment:string, professorId:ObjectId): Promise <Course>  => {
    return new Promise (async (resolve,reject) => {
        try {
            const db = await getDB();
            const collection = db.collection<Course>("courses");
            const course = new Course();
            course.courseCode = courseCode;
            course.courseName = courseName;
            course.courseDescription = courseDescription;
            course.courseDepartment = courseDepartment;
            course.professorId = professorId;
            course.createdAt = new Date();
            course.updatedAt = new Date();
            const result = await collection.insertOne(course);
            if(result.acknowledged) {
                course._id = result.insertedId;
                resolve(course);
            } else {
                throw new MongoInsertError("Error inserting course");
            }

        } catch(err) {
            console.error(err);
            throw new Error("Error inserting course");
        }
    })
} 

//add student to course
export const insertStudentCourse = async (courseId:ObjectId, studentId:ObjectId): Promise <Course>  => {
    return new Promise (async (resolve,reject) => {
        try {
            const db = await getDB();
            const collection = db.collection<Course>("courses");
            const userCollection = db.collection<User>("users");
            const course = await collection.findOne({ _id:courseId});
            const student = await userCollection.findOne({ _id:studentId});

            if(course && student){
                //check if student is already in course
                if(course.students.includes(studentId)){
                    throw new MongoInsertError("Student already in course");
                } else {
                    course.students.push(studentId);
                    const result = await collection.updateOne({ _id:courseId},{$set:course});
                    if(result.acknowledged) {
                        resolve(course);
                    } else {
                        throw new MongoInsertError("Error inserting student into course");
                    }
                }

            } else {
                throw new MongoFindError("Course not found");
            }
        } catch (err) {
            reject(err);
        }

    })
}