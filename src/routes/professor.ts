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
  getProfessorClasses,
  getStudentsInAdvisorGroup,
  getUserbyUsername,
} from "../mongo/queries/users";
import {
  addStudentToAdvisor,
  deleteCourseById,
  insertNewCourse,
  insertStudentCourse,
  removeStudentFromAdvisor,
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
import {
  getAppointmentByGuestId,
  getAppointmentbyId,
  getProfessorUpcomingMeetings,
} from "../mongo/queries/appointment";
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
          let not = await createNotification(
            studentId,
            "Added to course",
            message
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
        let not = await createNotification(
          studentId,
          "Added to advisor group",
          message
        );
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

router.put(
  "/update-appointment",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        let appointmentId = req.body.appointmentId;
        let appointmentStatus = req.body.appointmentStatus;
        let appointmentLocation = req.body.appointmentLocation;
        let summary = req.body.summary;

        let appointmentStatusEnum: AppointmentStatus = appointmentStatus;

        let updatedAppointment = await updateAppointmentStatusAndLocationById(
          appointmentId,
          appointmentStatusEnum
        );
          if (updatedAppointment) {
            let user = await getUserbyUsername(me.username);
            let apt = await getAppointmentbyId(appointmentId);
            let message = `${user.firstName} ${user.lastName} updated a meeting status to: ${appointmentStatus}`;
            let not = await createNotification(
              apt.student,
              "Appointment status updated",
              message
            );
            res.json({
              message: "Appointment Status Successfully Updated",
            });
          } else {
            throw new Error(
              "Something went wrong when changing appointment status"
            );
          }
        if (summary && summary.length > 0) {
          let add = await addSummary(
            appointmentId,
            summary,
            appointmentLocation
          );
          if (!add) {
            throw new BadRequestError(
              "Something went wrong when adding summary to appointment"
            );
          } else {
            res.json({
              message: "Appointment Location & Sumary Updated",
            });
          }
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
          const timeSlots = req.body.newTimeSlots;
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
    } catch (err) {
      next(err);
    }
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
router.get(
  "/pending-appointments:status?",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me) {
        let id = (await getUserbyUsername(me.username))._id;
        let status = req.query.status?.toString()|| AppointmentStatus.Pending;
        const appointments = await getPendingAppointmentsByProfessorId(id, status);
        if (appointments && appointments.length > 0) {
          res.json(appointments);
        } else {
          res.json([]); //no pending appointments
        }
      } else {
        throw new UnauthorizedError("Unauthorized"); 
      }
    } catch (err) {
      next(err);
    }
  }
);

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
          if (meetings.length > 0) {
            res.json(meetings);  
          } else {
            res.json({ message: "No upcoming meetings", success: false });
          }
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

        const editedPage = typeof page === "string" ? parseInt(page) : page;
        const editedLimit = typeof limit === "string" ? parseInt(limit) : limit;
        const filter = { search, page: editedPage, limit: editedLimit };

        const users = await getFilteredStudentsInAdvisorGroup(
          ensureObjectId(advisorId),
          filter
        );
        const total = await getFilteredStudentsInAdvisorGroupCount(
          ensureObjectId(advisorId),
          filter
        );

        if (users) {
          res.json({ success: true, data: { students: users, total } });
        } else {
          throw new BadRequestError("Something went wrong getting students");
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
        if (users) {
          res.json(users);
        } else {
          throw new BadRequestError("Something went wrong getting students");
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
        if (courseId) {
          const users = await getNotStudentsInCourse(courseId);
          if (users) {
            res.json(users);
          } else {
            throw new BadRequestError("Something went wrong getting students");
          }
        } else {
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
        if (courseId) {
          const course = await deleteCourseById(courseId);
          if (course) {
            res.json(course);
          } else {
            throw new BadRequestError("Something went wrong deleting course");
          }
        } else {
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

router.post(
  "/guest-appointments",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;

      if (me) {
        let guestId = (await getUserbyUsername(me.username))._id;
        if (guestId) {
          let guestAppointments = await getAppointmentByGuestId(guestId);
          if (guestAppointments.length > 0) {
            res.json(guestAppointments);
          } else {
            res.json([]);
          }
        } else {
          throw new UnauthorizedError(`You are not authorized`);
        }
      } else {
        throw new UnauthorizedError(`You are not authorized`);
      }
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/remove-student",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      const studentId = req.body.studentId;
      if (me) {
        let professorId = (await getUserbyUsername(me.username))._id;
        let deleteStudent = await removeStudentFromAdvisor(
          ensureObjectId(professorId),
          ensureObjectId(studentId)
        );
        if (deleteStudent) {
          res.json(deleteStudent);
        } else {
          //res.json("Student Not Found");
          throw new BadRequestError("Student not found");
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
  "/classes",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      if (me) {
        let professorId = (await getUserbyUsername(me.username))._id;
        if (professorId) {
          const classes = await getProfessorClasses(
            ensureObjectId(professorId)
          );
          res.json(classes);
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
export default router;
