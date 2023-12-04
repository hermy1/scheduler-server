import { DeleteResult, ObjectId } from "mongodb";
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

      const advisor = await AdvisorbyProfesserId(professorId);

      if (advisor) {
        const existingAdvisor = await getAdvisorbyProfesserId(professorId);
        let db = await getDB();
        let advisorCollection = db.collection<Advisor>('advisors');
        let userCollection = db.collection<User>('users');
        const student = await userCollection.findOne({ _id: studentId });

        if (student) {
          // Check to make sure the student is not in the advisor's array already
          for (const advStudentId of existingAdvisor.students) {
            if (advStudentId.equals(studentId)) {
              isMatch = true;
              break; // Exit the loop early since a match is found
            }
          }

          if (isMatch) {
            resolve('Student is already in this advisor');
          } else {
            // Add the student to the advisor's array
            existingAdvisor.students.push(student._id);
            const result = await advisorCollection.updateOne(
              { _id: existingAdvisor._id },
              { $set: { students: existingAdvisor.students } }
            );

            if (result.acknowledged) {
              resolve(true);
            } else {
              throw new MongoInsertError('Error inserting student into Advisor list');
            }
          }
        } else {
          throw new MongoFindError('Student Not Found');
        }
      } else {
        // Create advisor in table and continue
        let createAdvisorInTable = await createAdvisorInAdvisorsTable(professorId);

        if (createAdvisorInTable) {
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
                resolve(true);
              } else {
                throw new MongoInsertError('Error inserting student into Advisor list');
              }
            } else {
              throw new MongoFindError('Student Not Found');
            }
          }
        }
      }
    } catch (err) {
      reject(err);
    }
  });
};


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

export const deleteCourseById = async (courseId: ObjectId | string): Promise<boolean> => {
  try {
    let db = await getDB(); // Assuming getDB is a valid function that returns a MongoDB database instance

    const courseCollection = db.collection<Course>('courses');
    const courseIdObj = ensureObjectId(courseId);

    const deleteResult = await courseCollection.deleteOne({ _id: courseIdObj });
    if(deleteResult.deletedCount>0){
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw error;
  }
};

export const removeStudentFromAdvisor = async (professorId: ObjectId, studentId: ObjectId): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const advisorCollection = db.collection<Advisor>('advisors');
            const deletedResult = await advisorCollection.updateOne(
                { professorId: professorId},
                { $pull: { students: studentId } }
            );

            if (deletedResult.matchedCount > 0) {
                if (deletedResult.modifiedCount > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            } else {
                throw new MongoUpdateError("Something went wrong removing student from advisor")
            }

        } catch (error) {
            reject(error);
        }
    });
}

