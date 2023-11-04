import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { User,UserRole } from "../../models/user";
import { MongoFindError } from "../../core/errors/mongo";
import { Appointment, AppointmentStatus } from "../../models/appointment";
import { Advisor } from "../../models/advisor";
import { AggregationCursor, FindCursor, ObjectId, WithId } from "mongodb";

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
export const getUserbyEmail = async (email: string): Promise<User> => {
  return new Promise (async (resolve,reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({ email: email });
      if(result && result.email && result.email.length > 0){
        resolve(result);
      } else {
        reject(new MongoFindError("User not found"));
      }
    } catch (err) {}
  })
};

export const getUserbyId = async (userId: string): Promise<User> => {
  return new Promise (async (resolve,reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({ _id: ensureObjectId(userId) });
      if(result){
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

export const getAdvisorbyProfesserId = async (professorId: ObjectId): Promise<Advisor> => {
  return new Promise (async (resolve,reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<Advisor>("advisors");
      const result = await collection.findOne({ professorId: professorId });
      if(result){
        resolve(result);
      } else {
        reject(new MongoFindError("Professor Not Found"));
      }
    } catch (err) {}
  })
};
export const AdvisorbyProfesserId = async (professorId: ObjectId): Promise<boolean> => {
  return new Promise (async (resolve,reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<Advisor>("advisors");
      const result = await collection.findOne({ professorId: professorId });
      if(result){
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (err) {}
  })
};

// Assuming that 'Appointment' and 'User' have compatible structures
export const getUpcomingMeetings = async (student: ObjectId, status: AppointmentStatus): Promise<Appointment[]> => {
  try {
    const db = await getDB();
    const collection = db.collection<User>('users');
    const pipeline = [
      {
        $match: { _id: student },
      },
      {
        $lookup: {
          from: 'appointments',
          let: { id: "$_id" },
          pipeline: [
            // checking for student appointment & status accepted
            //TODO: only show appointments with future dates
            {$match:{ $and: [{$expr: { $eq: ['$student', '$$id'] }}, {$expr: {$eq: ['$status', status]}} ]} },
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
