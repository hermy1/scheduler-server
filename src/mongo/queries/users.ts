import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { PublicUser, User, UserRole } from "../../models/user";
import { MongoFindError } from "../../core/errors/mongo";
import { Appointment, AppointmentStatus } from "../../models/appointment";
import { Advisor } from "../../models/advisor";
import { AggregationCursor, FindCursor, ObjectId, WithId } from "mongodb";
import { Course } from "../../models/Course";

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
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({ username: username });
      if (result && result.username && result.username.length > 0) {
        resolve(result);
      } else {
        reject(new MongoFindError("User not found"));
      }
    } catch (err) { }
  })
};
//get user infor and remove password, birthdate, and email for public profile
export const getUserInfo = async (userId: ObjectId): Promise<PublicUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({ _id: ensureObjectId(userId) });
      if (result) {
        let user = new PublicUser();
        user._id = result._id;
        user.username = result.username;
        user.email = result.email;
        user.role = result.role;
        user.major = result.major;
        user.minor = result.minor;
        user.department = result.department;
        user.title = result.title;
        user.grade = result.grade;
        user.firstName = result.firstName;
        user.lastName = result.lastName;
        user.avatar = result.avatar;
        user.createdAt = result.createdAt;
        resolve(user);
      } else {
        reject(new MongoFindError("User not found"));
      }
    } catch (err) { 
     reject(err);
    }
  })
};
export const getUserbyEmail = async (email: string): Promise<User> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({ email: email });
      if (result && result.email && result.email.length > 0) {
        resolve(result);
      } else {
        reject(new MongoFindError("User not found"));
      }
    } catch (err) { 
      reject(err);
    }
  })
};

export const getUserbyId = async (userId: string): Promise<User> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({ _id: ensureObjectId(userId) });
      if (result) {
        resolve(result);
      } else {
        reject(new MongoFindError("User not found"));
      }
    } catch (err) { 
      reject(err);
    }
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
  return new Promise(async (resolve, reject) => {
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
  return new Promise(async (resolve, reject) => {
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
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<Advisor>("advisors");
      const result = await collection.findOne({ professorId: professorId });
      if (result) {
        resolve(result);
      } else {
        reject(new MongoFindError("Professor Not Found"));
      }
    } catch (err) { 
      reject(err);
    }
  })
};
export const AdvisorbyProfesserId = async (professorId: ObjectId): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<Advisor>("advisors");
      const result = await collection.findOne({ professorId: professorId });
      if (result) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (err) {
      reject(err);
     }
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
            { $match: { $and: [{ $expr: { $eq: ['$student', '$$id'] } }, { $expr: { $eq: ['$status', status] } }] } },
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

export const getProfessorsByUserId = async (id: ObjectId | string): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<Course>("courses");
      const result = await collection.find({ students: ensureObjectId(id) }).toArray();
      let professorList: string[] = [];
      if (result) {
        for (let i = 0; i < result.length; i++) {
          let professor = result[i].professorId.toString();
          if (!professorList.includes(professor)) {
            professorList.push(professor);
          }
        }

        const usersCollection = db.collection<User>('users');
        const professors = await usersCollection.find({ _id: { $in: professorList.map(id => new ObjectId(id)) } }).toArray();



        resolve(professors);
      } else {
        resolve([]);
      }
    } catch (err) {
      throw err;
    }
  })
};

export const getProfessorByUserId = async (professorId: ObjectId | string): Promise<User> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({
        _id: ensureObjectId(professorId),
        role: UserRole.Professor
      });
      if (result) {

        resolve(result);
      } else {
        reject(new MongoFindError("Professor Not Found"));
      }
    } catch (err) {
      throw err;
    }
  })
};

export const getAdvisorsByUserId = async (id: ObjectId | string): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<Advisor>("advisors");
      const result = await collection.find({ students: ensureObjectId(id) }).toArray();
      let AdvisorList: string[] = [];
      if (result) {
        for (let i = 0; i < result.length; i++) {
          let advisor = result[i].professorId.toString();
          if (!AdvisorList.includes(advisor)) {
            AdvisorList.push(advisor);
          }
        }

        const usersCollection = db.collection<User>('users');
        const professors = await usersCollection.find({ _id: { $in: AdvisorList.map(id => new ObjectId(id)) } }).toArray();

        resolve(professors);
      } else {
        resolve([]);
      }
    } catch (err) { }
  })
};

export const getAggregates = async (): Promise<{
  studentsCount: number;
  classesCount: number;
  professorsCount: number;
  appointmentsCount: number;
}> => {
  try {
    const db = await getDB();
    const studentsCount = await db.collection<User>('users').countDocuments({ role: UserRole.Student });
    const classesCount = await db.collection<Course>('courses').countDocuments();
    const professorsCount = await db.collection<User>('users').countDocuments({ role: UserRole.Professor });
    const appointmentsCount = await db.collection<Appointment>('appointments').countDocuments();

    const results = {
      studentsCount,
      classesCount,
      professorsCount,
      appointmentsCount,
    };

    return results;
  } catch (err) {
    throw err;
  }
};
export const getProfessorsAdvisorsByUserId = async (userId: ObjectId | string): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let professors = await getProfessorsByUserId(ensureObjectId(userId));
      let advisors = await getAdvisorsByUserId(ensureObjectId(userId));
      let all: string[] = [];

      professors.forEach((professor: any) => {
        if (!all.includes(professor)) {
          all.push(professor);
        }
      });

      advisors.forEach((advisor: any) => {
        if (!all.includes(advisor)) {
          all.push(advisor);
        }
      });

      if (all) {
        let db = await getDB();
        const usersCollection = db.collection<User>('users');
        const allProfiles = await usersCollection.find({ _id: { $in: all.map(id => new ObjectId(id)) } }).toArray();


        resolve(allProfiles);

      } else {
        reject(new MongoFindError("Professors and advisors Not Found"));
      }
    } catch (err) {
      throw err;
    }
  })
};

export const getProfessorsAdvisorsByUserIdButOne = async (userId: ObjectId | string, professorId: ObjectId | string): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let professors = await getProfessorsByUserId(ensureObjectId(userId));
      let advisors = await getAdvisorsByUserId(ensureObjectId(userId));
      let all: string[] = [];

      professors.forEach((professor: any) => {
        if (!all.includes(professor)) {
          all.push(professor);
        }
      });

      advisors.forEach((advisor: any) => {
        if (!all.includes(advisor)) {
          all.push(advisor);
        }
      });
      all = all.filter(item => item !== professorId);

      if (all) {
        let db = await getDB();
        const usersCollection = db.collection<User>('users');
        const allProfiles = await usersCollection.find({ _id: { $in: all.map(id => new ObjectId(id)) } }).toArray();


        resolve(allProfiles);
      } else {
        reject(new MongoFindError("Professors and advisors not Found"));
      }
    } catch (err) {
      throw err;
    }
  })
};

export const getAllStudentsInClassByClassId = async (classId: ObjectId | string): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const courseCollection = db.collection<Course>("courses");
      const course = await courseCollection.findOne({_id: ensureObjectId(classId)});
      if(course) {
        const studentIds = course.students;
        const userCollection = db.collection<User>("users");
        const students = [];
        for(let i=0; i<studentIds.length; i++) {
          const student = await userCollection.findOne({_id: studentIds[i]});
          if(student) {
            students[i] = student;
          }
        }

        if(students) {
          resolve(students);
        }


      } else {
        reject(new MongoFindError("List of students for given course ID not found"));
      }
    } catch (err) {
      throw err;
    }
  });
};

