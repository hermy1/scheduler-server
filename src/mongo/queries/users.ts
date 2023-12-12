import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { PublicUser, User, UserRole } from "../../models/user";
import { MongoFindError } from "../../core/errors/mongo";
import {
  Appointment,
  AppointmentStatus,
  FullAppointment,
} from "../../models/appointment";
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
        reject(new MongoFindError("Check username and password"));
      }
    } catch (err) {
      reject(err);
    }
  });
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
        user.gender = result.gender;
        user.birthday = result.birthdate;
        user.createdAt = result.createdAt;
        resolve(user);
      } else {
        reject(new MongoFindError("User not found"));
      }
    } catch (err) {
      reject(err);
    }
  });
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
  });
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
  });
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

//check if email exists
export const checkIfEmailExists = async (email: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({ email: email });
      if (result && result.email && result.email.length > 0) {
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
      const result = await collection
        .find({ role: UserRole.Student })
        .toArray();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const getFilteredStudents = async (filter: {
  search: string;
  page: number;
  limit: number;
}): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");

      let query: {} = {
        $and: [
          {
            $or: [
              { username: { $regex: filter.search, $options: "i" } },
              { lastName: { $regex: filter.search, $options: "i" } },
              { firstName: { $regex: filter.search, $options: "i" } },
            ],
          },
          { role: UserRole.Student },
        ],
      };

      const offset = filter.page * filter.limit;

      const results = await collection
        .find(query)
        .skip(offset)
        .limit(filter.limit)
        .toArray();

      resolve(results);
    } catch (err) {
      reject(err);
    }
  });
};

export const getFilteredStudentsCount = async (filter: {
  search: string;
  page: number;
  limit: number;
}): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = await db.collection<User>("users");

      let query: {} = {
        $and: [
          {
            $or: [
              { username: { $regex: filter.search, $options: "i" } },
              { lastName: { $regex: filter.search, $options: "i" } },
              { firstName: { $regex: filter.search, $options: "i" } },
            ],
          },
          { role: UserRole.Student },
        ],
      };
      const offset = filter.page * filter.limit;

      const results = await collection.countDocuments(query);

      if (results || results === 0) {
        resolve(results);
      } else {
        throw new MongoFindError(
          `Something went wrong while retriving students count`
        );
      }
    } catch (err: any) {
      reject(err);
    }
  });
};

//get all professors
export const getAllProfessors = async (): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection
        .find({ role: UserRole.Professor })
        .toArray();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const getAdvisorbyProfesserId = async (
  professorId: ObjectId
): Promise<Advisor> => {
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
  });
};
export const AdvisorbyProfesserId = async (
  professorId: ObjectId
): Promise<boolean> => {
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
  });
};

// Assuming that 'Appointment' and 'User' have compatible structures
export const getUpcomingMeetings = async (
  student: ObjectId,
  status: AppointmentStatus
): Promise<Appointment[]> => {
  try {
    const db = await getDB();
    const collection = db.collection<User>("users");
    console.log(new Date());
    const pipeline = [
      {
        $match: { _id: student },
      },
      {
        $lookup: {
          from: "appointments",
          let: { id: "$_id" },
          pipeline: [
            // checking for student appointment & status accepted
            // TODO: only show appointments with future dates
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$student", "$$id"] } },
                  { $expr: { $eq: ["$status", status] } },
                  { $expr: { $eq: ["$studentCancelled", false] } }, // Ensure studentCancelled is false
                  { $expr: { $gt: ["$startDateTime", new Date()] } }, // Only show appointments with future dates
                ],
              },
            },
          ],
          as: "appointment",
        },
      },
      {
        $unwind: { path: "$appointment", preserveNullAndEmptyArrays: false },
      },
      {
        $sort: {
          "appointment.startDateTime": 1, // Sort by startDateTime in ascending order (earliest first)
        },
      },
    ];

    const result: AggregationCursor<Appointment> =
      collection.aggregate(pipeline);
    const appointmentArray: Appointment[] = await result.toArray();
    return appointmentArray;
  } catch (err) {
    throw err;
  }
};

export const getProfessorsByUserId = async (
  id: ObjectId | string
): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<Course>("courses");
      const result = await collection
        .find({ students: ensureObjectId(id) })
        .toArray();
      let professorList: string[] = [];
      if (result) {
        for (let i = 0; i < result.length; i++) {
          let professor = result[i].professorId.toString();
          if (!professorList.includes(professor)) {
            professorList.push(professor);
          }
        }

        const usersCollection = db.collection<User>("users");
        const professors = await usersCollection
          .find({ _id: { $in: professorList.map((id) => new ObjectId(id)) } })
          .toArray();

        resolve(professors);
      } else {
        resolve([]);
      }
    } catch (err) {
      throw err;
    }
  });
};

export const getProfessorByUserId = async (
  professorId: ObjectId | string
): Promise<User> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<User>("users");
      const result = await collection.findOne({
        _id: ensureObjectId(professorId),
        role: UserRole.Professor,
      });
      if (result) {
        resolve(result);
      } else {
        reject(new MongoFindError("Professor Not Found"));
      }
    } catch (err) {
      throw err;
    }
  });
};

export const getAdvisorsByUserId = async (
  id: ObjectId | string
): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<Advisor>("advisors");
      const result = await collection
        .find({ students: ensureObjectId(id) })
        .toArray();
      let AdvisorList: string[] = [];
      if (result) {
        for (let i = 0; i < result.length; i++) {
          let advisor = result[i].professorId.toString();
          if (!AdvisorList.includes(advisor)) {
            AdvisorList.push(advisor);
          }
        }

        const usersCollection = db.collection<User>("users");
        const professors = await usersCollection
          .find({ _id: { $in: AdvisorList.map((id) => new ObjectId(id)) } })
          .toArray();

        resolve(professors);
      } else {
        resolve([]);
      }
    } catch (err) {}
  });
};

export const getAggregates = async (): Promise<{
  studentsCount: number;
  classesCount: number;
  professorsCount: number;
  appointmentsCount: number;
}> => {
  try {
    const db = await getDB();
    const studentsCount = await db
      .collection<User>("users")
      .countDocuments({ role: UserRole.Student });
    const classesCount = await db
      .collection<Course>("courses")
      .countDocuments();
    const professorsCount = await db
      .collection<User>("users")
      .countDocuments({ role: UserRole.Professor });
    const appointmentsCount = await db
      .collection<Appointment>("appointments")
      .countDocuments();

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
export const getProfessorsAdvisorsByUserId = async (
  userId: ObjectId | string
): Promise<User[]> => {
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
        const usersCollection = db.collection<User>("users");
        const allProfiles = await usersCollection
          .find({ _id: { $in: all.map((id) => new ObjectId(id)) } })
          .toArray();

        resolve(allProfiles);
      } else {
        reject(new MongoFindError("Professors and advisors Not Found"));
      }
    } catch (err) {
      throw err;
    }
  });
};
export const getProfessorsAdvisorsByUserIdButOne = async (
  userId: ObjectId | string,
  professorId: ObjectId | string
): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let professors = await getProfessorsByUserId(ensureObjectId(userId));
      let advisors = await getAdvisorsByUserId(ensureObjectId(userId));
      let all: string[] = [];

      professors.forEach((professor: User) => {
        if (!all.includes(professor._id.toString())) {
          all.push(professor._id.toString());
        }
      });

      advisors.forEach((advisor: User) => {
        if (!all.includes(advisor._id.toString())) {
          all.push(advisor._id.toString());
        }
      });
      all = all.filter((item) => item !== professorId.toString());

      if (all) {
        let db = await getDB();
        const usersCollection = db.collection<User>("users");
        const allProfiles = await usersCollection
          .find({ _id: { $in: all.map((id) => new ObjectId(id)) } })
          .toArray();

        resolve(allProfiles);
      } else {
        reject(new MongoFindError("Professors and advisors not Found"));
      }
    } catch (err) {
      reject(err);
    }
  });
};

export const getAllStudentsInClassByClassId = async (
  classId: ObjectId | string
): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const courseCollection = db.collection<Course>("courses");
      const course = await courseCollection.findOne({
        _id: ensureObjectId(classId),
      });
      if (course) {
        const studentIds = course.students;
        const userCollection = db.collection<User>("users");
        const students = [];
        for (let i = 0; i < studentIds.length; i++) {
          const student = await userCollection.findOne({ _id: studentIds[i] });
          if (student) {
            students[i] = student;
          }
        }

        if (students) {
          resolve(students);
        }
      } else {
        reject(
          new MongoFindError("List of students for given course ID not found")
        );
      }
    } catch (err) {
      throw err;
    }
  });
};

export const getPastMeetings = async (
  student: ObjectId,
  status: AppointmentStatus
): Promise<Appointment[]> => {
  try {
    const db = await getDB();
    const collection = db.collection<User>("users");
    const pipeline = [
      {
        $match: { _id: student },
      },
      {
        $lookup: {
          from: "appointments",
          let: { id: "$_id" },
          pipeline: [
            // checking for student appointment & status accepted & any end date/time less than the current date/time
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$student", "$$id"] } },
                  { $expr: { $eq: ["$status", status] } },
                  { $expr: { $lt: ["$endDateTime", new Date()] } },
                ],
              },
            },
          ],
          as: "appointment",
        },
      },
      {
        $unwind: { path: "$appointment", preserveNullAndEmptyArrays: false },
      },
    ];

    const result: AggregationCursor<Appointment> =
      collection.aggregate(pipeline);
    const appointmentArray: Appointment[] = await result.toArray();
    return appointmentArray;
  } catch (err) {
    throw err;
  }
};
export const getPendingAppointmentsByProfessorId = async (
  professorId: ObjectId | string,
  status: string
): Promise<FullAppointment[] | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const appointmentCollection = db.collection<Appointment>("appointments");
      const results: AggregationCursor<FullAppointment> =
        await appointmentCollection.aggregate([
          {
            $match: {
              professor: ensureObjectId(professorId),
              status: status,
              studentCancelled: false,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "student",
              foreignField: "_id",
              as: "studentInfo",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "professor",
              foreignField: "_id",
              as: "professorInfo",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "guest._id",
              foreignField: "_id",
              as: "guestInfo",
            },
          },
          {
            $project: {
              _id: 1,
              student: 1,
              professor: 1,
              startDateTime: 1,
              endDateTime: 1,
              status: 1,
              reason: 1,
              location: 1,
              guest: 1,
              secondaryStatus: 1,
              summary: 1,
              createdAt: 1,
              updatedAt: 1,
              studentCancelled: 1,
              studentName: {
                $concat: [
                  { $arrayElemAt: ["$studentInfo.firstName", 0] },
                  " ",
                  { $arrayElemAt: ["$studentInfo.lastName", 0] },
                ],
              },
              professorName: {
                $concat: [
                  { $arrayElemAt: ["$professorInfo.firstName", 0] },
                  " ",
                  { $arrayElemAt: ["$professorInfo.lastName", 0] },
                ],
              },
              guestName: {
                $concat: [
                  { $arrayElemAt: ["$guestInfo.firstName", 0] },
                  " ",
                  { $arrayElemAt: ["$guestInfo.lastName", 0] },
                ],
              },
            },
          },
        ]);

      const resultArray = await results.toArray();

      if (resultArray.length > 0) {
        resolve(resultArray);
      } else {
        resolve(null);
      }
    } catch (err) {
      reject(err);
    }
  });
};

export const getProfessorInfoByProfessorId = async (
  professorId: ObjectId | string
): Promise<User> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const userCollection = db.collection<User>("users");
      const user = await userCollection.findOne({
        _id: ensureObjectId(professorId),
      });
      if (user) {
        if (user.role === UserRole.Professor) {
          resolve(user);
        } else {
          reject(
            new MongoFindError("The given ID exists, but is not a professor ID")
          );
        }
      } else {
        reject(
          new MongoFindError("Could not find a professor with the given ID")
        );
      }
    } catch (err) {
      throw err;
    }
  });
};

export const getClassesByProfessor = async (
  professorId: ObjectId | string,
  studentId: string | ObjectId
): Promise<{ courseName: string; courseCode: string }[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let db = await getDB();
      const collection = db.collection<Course>("courses");
      const result = await collection
        .find({
          students: ensureObjectId(studentId),
          professorId: ensureObjectId(professorId),
        })
        .toArray();
      let classesList: { courseName: string; courseCode: string }[] = [];

      if (result) {
        for (let i = 0; i < result.length; i++) {
          const course = result[i];
          const { courseName, courseCode } = course;
          classesList.push({ courseName, courseCode });
        }

        resolve(classesList);
      } else {
        resolve([]);
      }
    } catch (err) {
      reject(err);
    }
  });
};

export const getStudentsInAdvisorGroup = async (
  professorId: ObjectId | string
): Promise<User[]> => {
  try {
    let db = await getDB();

    const advisorCollection = db.collection<Advisor>("advisors");
    const userCollection = db.collection<User>("users");

    const advisorId = ensureObjectId(professorId);

    const pipeline = [
      {
        $match: {
          professorId: advisorId,
        },
      },
      {
        $unwind: "$students",
      },
      {
        $lookup: {
          from: "users", // Assuming the users collection is named 'users'
          localField: "students",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: "$studentData",
      },
      {
        $replaceRoot: { newRoot: "$studentData" },
      },
    ];

    const result: AggregationCursor<User> = await advisorCollection.aggregate(
      pipeline
    );
    const results: User[] = await result.toArray();

    return results;
  } catch (error) {
    throw error;
  }
};

export const getFilteredStudentsInAdvisorGroup = async (
  professorId: ObjectId | string,
  filter: { search: string; page: number; limit: number }
): Promise<User[]> => {
  try {
    let db = await getDB();

    const advisorCollection = db.collection<Advisor>("advisors");
    const userCollection = db.collection<User>("users");

    const advisorId = ensureObjectId(professorId);

    const pipeline = [
      {
        $match: {
          professorId: advisorId,
        },
      },
      {
        $unwind: "$students",
      },
      {
        $lookup: {
          from: "users",
          localField: "students",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: "$studentData",
      },
      {
        $replaceRoot: { newRoot: "$studentData" },
      },
      {
        $match: {
          $or: [
            { username: { $regex: filter.search, $options: "i" } },
            { lastName: { $regex: filter.search, $options: "i" } },
            { firstName: { $regex: filter.search, $options: "i" } },
          ],
        },
      },
      {
        $skip: filter.page * filter.limit,
      },
      {
        $limit: filter.limit,
      },
    ];

    const result: AggregationCursor<User> = await advisorCollection.aggregate(
      pipeline
    );
    const results: User[] = await result.toArray();

    return results;
  } catch (error) {
    throw error;
  }
};

export const getFilteredStudentsInAdvisorGroupCount = async (
  professorId: ObjectId | string,
  filter: { search: string; page: number; limit: number }
): Promise<number> => {
  try {
    let db = await getDB();

    const advisorCollection = db.collection<Advisor>("advisors");
    const userCollection = db.collection<User>("users");

    const advisorId = ensureObjectId(professorId);

    const pipeline = [
      {
        $match: {
          professorId: advisorId,
        },
      },
      {
        $unwind: "$students",
      },
      {
        $lookup: {
          from: "users",
          localField: "students",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: "$studentData",
      },
      {
        $replaceRoot: { newRoot: "$studentData" },
      },
      {
        $match: {
          $or: [
            { username: { $regex: filter.search, $options: "i" } },
            { lastName: { $regex: filter.search, $options: "i" } },
            { firstName: { $regex: filter.search, $options: "i" } },
          ],
        },
      },
      {
        $skip: filter.page * filter.limit,
      },
      {
        $limit: filter.limit,
      },
    ];

    const result: AggregationCursor<User> = await advisorCollection.aggregate(
      pipeline
    );
    const results: User[] = await result.toArray();

    return results.length;
  } catch (error) {
    throw error;
  }
};

export const getNotStudentsInAdvisorGroup = async (
  professorId: ObjectId | string
): Promise<User[]> => {
  try {
    let db = await getDB();

    const advisorCollection = db.collection<Advisor>("advisors");
    const userCollection = db.collection<User>("users");

    const advisorId = ensureObjectId(professorId);

    const pipeline = [
      {
        $match: {
          professorId: advisorId,
        },
      },
      {
        $unwind: "$students",
      },
      {
        $lookup: {
          from: "users",
          localField: "students",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: "$studentData",
      },
      {
        $replaceRoot: { newRoot: "$studentData" },
      },
    ];

    const advisorResult: AggregationCursor<User> =
      await advisorCollection.aggregate(pipeline);
    const advisorStudentsInGroup = await advisorResult.toArray();

    // Get all students
    const allStudents = await userCollection
      .find({ role: UserRole.Student })
      .toArray();

    // Filter out students already in the advisor group
    const notInAdvisorGroup = allStudents.filter(
      (student) =>
        !advisorStudentsInGroup.some((advisorStudent) =>
          advisorStudent._id.equals(student._id)
        )
    );

    return notInAdvisorGroup;
  } catch (error) {
    throw error;
  }
};
export const getNotStudentsInCourse = async (
  courseId: ObjectId | string
): Promise<User[]> => {
  try {
    let db = await getDB();

    const courseCollection = db.collection<Course>("courses");
    const userCollection = db.collection<User>("users");

    const courseIdObj = ensureObjectId(courseId);

    const pipeline = [
      {
        $match: {
          _id: courseIdObj,
        },
      },
      {
        $unwind: "$students",
      },
      {
        $lookup: {
          from: "users",
          localField: "students",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: "$studentData",
      },
      {
        $replaceRoot: { newRoot: "$studentData" },
      },
    ];

    const courseResult: AggregationCursor<User> =
      await courseCollection.aggregate(pipeline);
    const courseStudents = await courseResult.toArray();

    // Get all students
    const allStudents = await userCollection
      .find({ role: UserRole.Student })
      .toArray();

    // Filter out students already in the course
    const notInCourse = allStudents.filter(
      (student) =>
        !courseStudents.some((courseStudent) =>
          courseStudent._id.equals(student._id)
        )
    );

    return notInCourse;
  } catch (error) {
    throw error;
  }
};
export const getProfessorClasses = async ( professorId: ObjectId | string ): Promise<Course[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const courseCollection = db.collection<Course>("courses");
      const course: AggregationCursor<Course> =
        await courseCollection.aggregate([
          {
            $match: {
              professorId: ensureObjectId(professorId),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "students",
              foreignField: "_id",
              as: "studentData",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "professorId",
              foreignField: "_id",
              as: "professorName",
            },
          },
          {
            $unwind: {
              path: "$studentData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$professorName",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              professorName: "$professorName.firstName",
            },
          },
          {
            $project: {
              _id: 1,
              courseName: 1,
              courseCode: 1,
              professorId: 1,
              courseDepartment: 1,
              courseDescription: 1,
              professorName: 1,
              createdAt: 1,
              updatedAt: 1,
              studentData: {
                _id: 1,
                username: 1,
                firstName: 1,
                lastName: 1,
                grade: 1,
              },
            },
          },
          {
            $group: {
              _id: "$_id",
              courseName: { $first: "$courseName" },
              courseCode: { $first: "$courseCode" },
              professorId: { $first: "$professorId" },
              courseDepartment: { $first: "$courseDepartment" },
              courseDescription: { $first: "$courseDescription" },
              professorName: { $first: "$professorName" },
              createdAt: { $first: "$createdAt" },
              updatedAt: { $first: "$updatedAt" },
              students: { $push: "$studentData" },
            },
          },
        ]);
      const courses = await course.toArray();
      resolve(courses);
    } catch (err) {
      reject(err);
    }
  });
};
