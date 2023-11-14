import { ObjectId } from "mongodb";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { MongoFindError, MongoInsertError, MongoUpdateError } from "../../core/errors/mongo";
import {Course} from "../../models/Course";
import { User } from "../../models/user";
import { Advisor } from "../../models/advisor";
import { AdvisorbyProfesserId, getAdvisorbyProfesserId } from "../queries/users";


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

export const addStudentToAdvisor = async (professorId: ObjectId, studentId: ObjectId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let isMatch = false;

        const a = await AdvisorbyProfesserId(professorId);
        if (a) {
          let advisor = await getAdvisorbyProfesserId(professorId);
          let db = await getDB();
          let advisorCollection = db.collection<Advisor>('advisors');
          let userCollection = db.collection<User>('users');
          const student = await userCollection.findOne({ _id: studentId });
          if (student) {
            //check to make sure not in array already
            console.log(advisor);

          for (const student of advisor.students) {
            if (student.equals(ensureObjectId(studentId))) {
              console.log(studentId,ensureObjectId(studentId))
              isMatch = true;
              break; // Exit the loop early since a match is found
            }
          }

      if (isMatch) {
        resolve('Student is already in this advisor');
      } else {      


            advisor.students.push(student._id);
            const result = await advisorCollection.updateOne(
              { _id: advisor._id },
              { $set: { students: advisor.students } }
            );
  
            if (result.acknowledged) {
              resolve(true);
            } else {
              throw new MongoInsertError("Error inserting student into Advisor list");
            }
          }
        } else {
          //create advisor in table and continue
          let createAdvisorInTable = await createAdvisorInAdvisorsTable(professorId);
          if (createAdvisorInTable){
            const advisor = await getAdvisorbyProfesserId(professorId);
        if (advisor) {
            let db = await getDB();
            let advisorCollection = db.collection<Advisor>('advisors');
            let userCollection = db.collection<User>('users');
            const student = await userCollection.findOne({ _id: studentId });
            if (student) {
              advisor.students.push(student._id);
              const result = await advisorCollection.updateOne(
                { _id: advisor._id },
                { $set: { students: advisor.students } }
              );
    
              if (result.acknowledged) {
                resolve(result);
              } else {
                throw new MongoInsertError("Error inserting student into Advisor list");
              }
            } else {
              throw new MongoFindError('Student Not Found');
            }

        }
          }}}
      } catch (err) {
        reject(err);
      }
    });
  }

  export const createAdvisorInAdvisorsTable = async (professorId: ObjectId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let db = await getDB();
        let advisorCollection = db.collection<Advisor>('advisors');
        let newA = new Advisor();
        newA.professorId = professorId;

        let insert = await advisorCollection.insertOne(newA);
        if(insert.acknowledged){
          resolve(true);

        } else {
          throw new MongoInsertError("Something went wrong while inserting advisor into advisors table");

        }
        
      } catch (err) {
        reject(err);
      }
    });
  }
