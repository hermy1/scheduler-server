import express, { Request, Response, NextFunction, Router } from "express";
import { Me } from "../models/me";
import { isLoggedIn, isProfessor, isStudent } from "../core/middleware/auth";
import {
  addSummary,
  updateAppointmentStatusAndLocationById,
} from "../mongo/mutations/appointment";
import {
  checkIfUserExists,
  getAdvisorbyProfesserId,
  getAggregates,
  getAllProfessors,
  getAllStudents,
  getAllStudentsInClassByClassId,
  getFilteredStudentsInAdvisorGroup,
  getFilteredStudentsInAdvisorGroupCount,
  getNotStudentsInAdvisorGroup,
  getNotStudentsInCourse,
  getPendingAppointmentsByProfessorId,
  getStudentsInAdvisorGroup,
  getUserbyUsername,
} from "../mongo/queries/users";
import {
  addStudentToAdvisor,
  deleteCourseById,
  insertNewCourse,
  insertStudentCourse,
} from "../mongo/mutations/professor";
import {
  insertAvailability,
  deleteAvailability,
} from "../mongo/mutations/availability";
import { BadRequestError, UnauthorizedError } from "../core/errors/user";
import { ensureObjectId } from "../core/config/utils/mongohelper";
import {
  getAvailabilityById,
  getAvailabilityByProfessorId,
  getAvailabilityListByProfessorId,
} from "../mongo/queries/availability";
import { updateAvailability } from "../mongo/mutations/availability";
import { ObjectId } from "mongodb";
import { AppointmentStatus } from "../models/appointment";
import { MongoFindError } from "../core/errors/mongo";
import { getAppointmentbyId, getProfessorUpcomingMeetings } from "../mongo/queries/appointment";
import { createNotification } from "../mongo/mutations/notification";

const router: Router = express.Router();

//get all professors
router.get(
  "/professors",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const professors = await getAllProfessors();
      res.json(professors);
    } catch (err) {
      next(err);
    }
  }
);

//insert new course by professor
router.post(
  "/add-course",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        const user = await getUserbyUsername(me.username);
        if (user) {
          const courseCode = req.body.courseCode
            .toUpperCase()
            .trim()
            .toString();
          const courseName = req.body.courseName.toString();
          const courseDescription = req.body.courseDescription.toString();
          const courseDepartment = req.body.courseDepartment.toString();
          const professorId = user._id;
          const course = await insertNewCourse(
            courseCode,
            courseName,
            courseDescription,
            courseDepartment,
            professorId
          );
          res.json(course);
        } else {
          throw new UnauthorizedError("Unauthorized");
        }
      } else {
        throw new UnauthorizedError("Unauthorized");
      }
    } catch (err) {
      next(err);
    }
  }
);

//add student to course
router.post(
  "/add-student",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        const user = await getUserbyUsername(me.username);
        if (user) {
          const courseId = req.body.courseId;
          const studentId = req.body.studentId;
          const course = await insertStudentCourse(
            ensureObjectId(courseId),
            ensureObjectId(studentId)
          );
          //add notification for student
          let message = `${user.firstName} ${user.lastName} added you to a class`;
          let not = await createNotification(studentId,"Added to course",message);
          res.json(course);
        } else {
          throw new UnauthorizedError("Unauthorized");
        }
      } else {
        throw new UnauthorizedError("Unauthorized");
      }
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/add-student-to-advisor",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        const studentId = req.body.studentId;
        let professorId = (await getUserbyUsername(me.username))._id;
        const addStudent = await addStudentToAdvisor(
          ensureObjectId(professorId),
          ensureObjectId(studentId)
        );
        let user = await getUserbyUsername(me.username);
        let message = `${user.firstName} ${user.lastName} added you to their advising group`;
        let not = await createNotification(studentId,"Added to advisor group",message);
        res.json(addStudent);
      } else {
        throw new UnauthorizedError("Unauthorized");
      }
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/allStudents",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      if (me) {
        let allStudents = await getAllStudents();
        if (allStudents) {
          let count = allStudents.length;
          res.json({ students: allStudents, count: count });
        } else {
          throw new BadRequestError(
            "Something went wrong when getting all students"
          );
        }
      } else {
        res.json({ message: "You are not authorized" });
        throw new UnauthorizedError(`You are not authorized`);
      }
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/aggregates",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      if (me) {
        let aggregates = await getAggregates();
        if (aggregates) {
          res.json({ aggregates });
        } else {
          throw new BadRequestError(
            "Something went wrong when getting aggreagtes"
          );
        }
      } else {
        res.json({ message: "You are not authorized" });
        throw new UnauthorizedError(`You are not authorized`);
      }
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/studentsInCourse",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.query.courseId;
      if (courseId) {
        let students = await getAllStudentsInClassByClassId(
          courseId.toString()
        );
        if (students) {
          res.json(students);
        } else {
          throw new BadRequestError(
            "Something went wrong when getting students in specified course"
          );
        }
      } else {
        throw new BadRequestError("URI Cannot be empty");
      }
    } catch (err) {
      next(err);
    }
  }
);
router.post(
  "/update-apointment-status",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        let appointmentId = req.body.appointmentId;
        let appointmentStatus = req.body.appointmentStatus;
        let appointmentLocation = req.body.appointmentLocation;

        let appointmentStatusEnum: AppointmentStatus;
        switch (appointmentStatus) {
          case AppointmentStatus.Pending:
          case AppointmentStatus.Accepted:
          case AppointmentStatus.Rejected:
          case AppointmentStatus.Cancelled:
            appointmentStatusEnum = appointmentStatus as AppointmentStatus;
            break;
          default:
            throw new Error(`Invalid appointment status: ${appointmentStatus}`);
        }

        let updatedAppointment = await updateAppointmentStatusAndLocationById(
          appointmentId,
          appointmentStatusEnum,
          appointmentLocation
        );
        if (updatedAppointment) {
          //add notification for student
          let user = await getUserbyUsername(me.username);
          let apt = await getAppointmentbyId(appointmentId);
          let message = `${user.firstName} ${user.lastName} updated a meeting status to: ${appointmentStatus}`;
          let not = await createNotification(apt.student,"Appointment status updated", message);
          res.json({
            message: "Appointment Status Successfully Updated",
            appointment: updatedAppointment,
          });
        } else {
 
          throw new Error("Something went wrong when updating appointment");
        }
      }
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/addSummary",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        let appointmentId = req.body.appointmentId.toString();
        let summary = req.body.summary.toString();

        let add = await addSummary(appointmentId, summary);
        if (add) {
          let user = await getUserbyUsername(me.username);
          let message = `${user.firstName} ${user.lastName} added a summary to a past meeting`;
          let apt = await getAppointmentbyId(appointmentId);
          let not = await createNotification(apt.student,"Summary added",message);

          res.json(add);
        } else {
    
          throw new BadRequestError(
            "Something went wrong when adding summary to appointment"
          );
        }
      }
    } catch (err) {
      next(err);
    }
  }
);

//get my availability, by professor who is logged in
router.get(
  "/my-availability",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        const user = await getUserbyUsername(me.username);
        if (user) {
          const professorId = user._id;
          const availability = await getAvailabilityListByProfessorId(
            ensureObjectId(professorId)
          );
          if (availability) {
            res.json(availability);
          } else {
            throw new BadRequestError(
              "Something went wrong when getting availability"
            );
          }
        } else {
          throw new UnauthorizedError("Unauthorized");
        }
      }
    } catch (err) {
      next(err);
    }
  }
);

//get availability for professor by Id (professorId)
router.get(
  "/availability/:id",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let professorId = req.params.id;
      const availability = await getAvailabilityByProfessorId(
        ensureObjectId(professorId)
      );
      if (availability) {
        res.json(availability);
      } else {
        throw new BadRequestError(
          "Something went wrong when getting availability"
        );
      }
    } catch (err) {
      next(err);
    }
  }
);
//add availability
router.post(
  "/add-availability",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        const user = await getUserbyUsername(me.username);
        if (user) {
          const professorId = user._id;
          const weekDay = req.body.weekDay;
          const date = req.body.date;
          const timeSlots = req.body.timeSlots;
          const availability = await insertAvailability(
            ensureObjectId(professorId),
            weekDay,
            date,
            timeSlots
          );
          res.json(availability);
        } else {
          throw new UnauthorizedError("Unauthorized");
        }
      } else {
        throw new UnauthorizedError("Unauthorized");
      }
    } catch (err) {}
  }
);

//update availability
router.put(
  "/update-availability",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        const availabilityId = req.body.availabilityId;
        let addTimeSlots: { startTime: Date; endTime: Date }[] =
          req.body.newTimeSlots;
        let removeTimeSlots: { startTime: Date; endTime: Date }[] =
          req.body.removeTimeSlots;
        const date = new Date(req.body.date);
        const weekDay = req.body.weekDay;
        // Ensure addTimeSlots and removeTimeSlots are arrays
        if (!Array.isArray(addTimeSlots)) {
          addTimeSlots = [];
        }
        if (!Array.isArray(removeTimeSlots)) {
          removeTimeSlots = [];
        }
        //find availability by id
        const findAvailability = await getAvailabilityById(
          ensureObjectId(availabilityId)
        );
        if (findAvailability) {
          //update availability
          const availability = await updateAvailability(
            ensureObjectId(availabilityId),
            date,
            weekDay,
            addTimeSlots,
            removeTimeSlots
          );
          res.json(availability);
        } else {
          throw new UnauthorizedError("Unauthorized");
        }
      } else {
        throw new UnauthorizedError("Unauthorized");
      }
    } catch (err) {
      next(err);
    }
  }
);
//DELETE availability
router.delete(
  "/delete-availability/:id",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        const availabilityId = req.params.id;
        const availability = await getAvailabilityById(
          ensureObjectId(availabilityId)
        );
        if (availability) {
          const result = await deleteAvailability(
            ensureObjectId(availabilityId)
          );
          res.json({ message: "Availability deleted", success: true });
        } else {
          throw new BadRequestError(
            "Something went wrong when deleting availability"
          );
        }
      } else {
        throw new UnauthorizedError("Unauthorized");
      }
    } catch (err) {
      next(err);
    }
  }
);

//get pending appointments by professor id
router.get("/pending-appointments", isLoggedIn, isProfessor, async(req: Request, res: Response, next: NextFunction) => {
  try {
    let me = req.session.Me;
    if(me) {
      let id = (await getUserbyUsername(me.username))._id;
      const appointments = await getPendingAppointmentsByProfessorId(id);
      if(appointments) {
        res.json(appointments);
      } else {
        throw new BadRequestError("Something went wrong grabbing appointments for given professor ID");
      }
    } else {
      throw new UnauthorizedError("Unauthorized");
    }
  } catch (err) {
    next(err)
  }
});

router.get(
  "/upcoming",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      if (me) {
        let professorId = (await getUserbyUsername(me.username))._id;
        const status = AppointmentStatus.Accepted;
        if (professorId) {
          const meetings = await getProfessorUpcomingMeetings(
            ensureObjectId(professorId),
            status
          );
          res.json(meetings);
        } else {

          throw new BadRequestError(
            "Something went wrong when getting upcoming meetings"
          );
        }
      } else {
        throw new UnauthorizedError(`You are not authorized`);
      }
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/advisor-students",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      const page = req.query.page?.toString() || 0;
      const search = req.query.search?.toString() || "";      
      const limit = req.query.limit?.toString() || 10;

      if (me) {
        const advisorId = (await getUserbyUsername(me.username))._id;



  
        const editedPage = typeof (page) === "string" ? parseInt(page) : page; 
        const editedLimit = typeof (limit) === "string" ? parseInt(limit) : limit; 
        const filter = { search, page: editedPage, limit: editedLimit };
  


        
        const users = await getFilteredStudentsInAdvisorGroup(ensureObjectId(advisorId),filter);
        const total = await getFilteredStudentsInAdvisorGroupCount(ensureObjectId(advisorId),filter);

        if(users){
          res.json({ success: true, data: { students: users, total } });

        }else {
          throw new BadRequestError('Something went wrong getting students');
        }

      } else {
        throw new UnauthorizedError(`You are not authorized`);
      }
    } catch (err) {
      // You might want to log the error here for debugging purposes
      next(err);
    }
  }
);

router.get(
  "/advisor-students-new",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;

      if (me) {
        const advisorId = (await getUserbyUsername(me.username))._id;
        
        const users = await getNotStudentsInAdvisorGroup(
          ensureObjectId(advisorId)
        );
        if(users){
                  res.json(users);

        }else {
          throw new BadRequestError('Something went wrong getting students');
        }

      } else {
        throw new UnauthorizedError(`You are not authorized`);
      }
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/course-students-new",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      let courseId = req.query.courseId?.toString();

      if (me) {
        if(courseId){
           const users = await getNotStudentsInCourse(courseId );
        if(users){
                  res.json(users);

        }else {
          throw new BadRequestError('Something went wrong getting students');
        }
        } else{
          throw new BadRequestError("Send up valid courseId");
        }
        
       

      } else {
        throw new UnauthorizedError(`You are not authorized`);
      }
    } catch (err) {
      next(err);
    }
  }
);


router.delete(
  "/delete-course",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      let courseId = req.body.courseId?.toString();

      if (me) {
        if(courseId){
           const course = await deleteCourseById(courseId );
        if(course){
                  res.json(course);

        }else {
          throw new BadRequestError('Something went wrong deleting course');
        }
        } else{
          throw new BadRequestError("Send up valid courseId");
        }
        
       

      } else {
        throw new UnauthorizedError(`You are not authorized`);
      }
    } catch (err) {
      next(err);
    }
  }
);

export default router;



