import { AggregationCursor, ObjectId } from "mongodb";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { MongoFindError, MongoInsertError } from "../../core/errors/mongo";
import { Course } from "../../models/Course";
import { Advisor } from "../../models/advisor";
import { Appointment, AppointmentStatus } from "../../models/appointment";
import { User } from "../../models/user";

export const UserInAdvisor = async (advisorId: string, userId: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Advisor>('advisors');
            const results = await collection.findOne({ professorId: ensureObjectId(advisorId)});
            if (results) {
                let studentsArray = results.students
                for(let i=0;i<studentsArray.length;i++){
                    console.log('in loop');

                    if (studentsArray[i].toString() === userId){
                        console.log('is true',studentsArray[i],ensureObjectId(userId));
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            } else {
                resolve(false);
            }
        } catch (err: any) {
            reject(err);
        }
    });
};

export const UserInProfessorCourse = async (professorId: string, userId: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Course>('courses');
            const course = await collection.findOne({
                professorId: ensureObjectId(professorId),
                students: {
                  $elemMatch: { $eq: ensureObjectId(userId) }
                }
              });
              if (course !== null){
                resolve(true);
              } else {
                resolve(false);
              }
        } catch (err: any) {
            reject(err);
        }
    });
};

export const getAppointmentbyId = async (appId: string): Promise<Appointment> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Appointment>('appointments');
            const appointment = await collection.findOne({_id: ensureObjectId(appId)});
            if (appointment) {
                resolve(appointment)
            }else {
                reject(new MongoFindError('Could not find appointment for id'));
            }
        } catch (err: any) {
            reject(err)
        }
    })
}

export const getProfessorUpcomingMeetings = async (professor: ObjectId, status: AppointmentStatus): Promise<Appointment[]> => {
    try {
      const db = await getDB();
      const collection = db.collection<User>('users');
      const pipeline = [
        {
          $match: { _id: professor },
        },
        {
          $lookup: {
            from: 'appointments',
            let: { id: "$_id" },
            pipeline: [
              // checking for professor appointment & status accepted
              //TODO: only show appointments with future dates
              { $match: { $and: [{ $expr: { $eq: ['$student', '$$id'] } }, { $expr: { $eq: ['$status', status] } },
                {$expr: {$gt:['$startDateTime', new Date()]}}] } },
            ],
            as: 'appointment',
          },
        },
        {
          $unwind: { path: '$appointment', preserveNullAndEmptyArrays: false },
        },
      ];
  
      const result: AggregationCursor<Appointment> = collection.aggregate(pipeline);
      const appointmentArray: Appointment[] = await result.toArray();
      return appointmentArray;
    } catch (err) {
      throw err;
    }
  };