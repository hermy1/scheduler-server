
import express, { Request, Response, NextFunction, Router } from "express";
import { Me } from "../../models/me";
import { isLoggedIn, isProfessor, isStudent } from "../middleware/auth";
import { checkIfUserExists, getAdvisorbyProfesserId, getAggregates, getAllProfessors, getAllStudents, getUserbyUsername } from "../../mongo/queries/users";
import { addStudentToAdvisor, insertNewCourse, insertStudentCourse } from "../../mongo/mutations/professor";
import { insertAvailability, deleteAvailability } from "../../mongo/mutations/availability";
import { BadRequestError, UnauthorizedError } from "../errors/user";
import { ensureObjectId } from "../config/utils/mongohelper";
import { getAvailabilityById, getAvailabilityByProfessorId, getAvailabilityListByProfessorId } from "../../mongo/queries/availability";
import { updateAvailability } from "../../mongo/mutations/availability";


const router: Router = express.Router();

//get all professors
router.get('/professors', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const professors = await getAllProfessors();
      res.json(professors);
    } catch (err) {
      next(err);
    }
  });

  //insert new course by professor
  router.post('/add-course', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        const user = await getUserbyUsername(me.username);
        if (user) {
          const courseCode = req.body.courseCode.toUpperCase().trim().toString();
          const courseName = req.body.courseName.toString();
          const courseDescription = req.body.courseDescription.toString();
          const courseDepartment = req.body.courseDepartment.toString();
          const professorId = user._id;
          const course = await insertNewCourse(courseCode, courseName, courseDescription, courseDepartment, professorId);
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
  });
  
//add student to course
router.post('/add-student', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      if (me && me.username && me.username.length > 0) {
        const user = await getUserbyUsername(me.username);
        if (user) {
          const courseId = req.body.courseId;
          const studentId = req.body.studentId;
          const course = await insertStudentCourse(ensureObjectId(courseId), ensureObjectId(studentId));
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
});


router.post('/add-student-to-advisor', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let me = req.session.Me;
    if (me && me.username && me.username.length > 0) {
        const studentId = req.body.studentId;
        let professorId = (await getUserbyUsername(me.username))._id;
        const addStudent = await addStudentToAdvisor(ensureObjectId(professorId), ensureObjectId(studentId));
        res.json(addStudent);
    } else {
      throw new UnauthorizedError("Unauthorized");
    }
  } catch (err) {
    next(err);
  }
});

router.get('/allStudents', isLoggedIn, isProfessor, async(req:Request, res:Response, next: NextFunction)=>{
  try {
    const me = req.session.Me;
    if (me){
      let allStudents = await getAllStudents();
      if (allStudents){
        let count = allStudents.length;
        res.json({students: allStudents, count: count});
      } else {
        throw new BadRequestError("Something went wrong when getting all students");

      }
  } else {
    res.json({message: "You are not authorized"});
    throw new UnauthorizedError(`You are not authorized`);
  }
  } catch (err) {
    next(err);
  }
});

router.get('/aggregates', isLoggedIn, isProfessor, async(req:Request, res:Response, next: NextFunction)=>{
  try {
    const me = req.session.Me;
    if (me){
      let aggregates = await getAggregates();
      if (aggregates){
        res.json({aggregates});
      } else {
        throw new BadRequestError("Something went wrong when getting aggreagtes");

      }
  } else {
    res.json({message: "You are not authorized"});
    throw new UnauthorizedError(`You are not authorized`);
  }
  } catch (err) {
    next(err);
  }
});

//get my availability, by professor who is logged in
router.get('/my-availability', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let me = req.session.Me;
    if(me && me.username && me.username.length > 0){
      const user = await getUserbyUsername(me.username);
      if(user){
        const professorId = user._id;
        const availability = await getAvailabilityListByProfessorId(ensureObjectId(professorId));
        if (availability) {
          res.json(availability);
        } else {
          throw new BadRequestError("Something went wrong when getting availability");
        }
      } else {
        throw new UnauthorizedError("Unauthorized");
      }
    
    }
  } catch (err) {
    next(err);
  }
});
//get availability for professor by Id (professorId)
router.get('/availability/:id', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
    try {
      let professorId = req.params.id;
      const availability = await getAvailabilityByProfessorId(ensureObjectId(professorId));
      if (availability) {
        res.json(availability);
      } else {
        throw new BadRequestError("Something went wrong when getting availability");
      }
    } catch (err) {
      next(err);
    }
});
//add availability
router.post('/add-availability', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let me = req.session.Me;
    if(me && me.username && me.username.length > 0){
      const user = await getUserbyUsername(me.username);
      if(user){
       
        const professorId = user._id;
        const weekDay = req.body.weekDay;
        const date = req.body.date;
        const timeSlots = req.body.timeSlots;
        const availability = await insertAvailability(ensureObjectId(professorId), weekDay, date, timeSlots);
        res.json(availability);
      } else {
        throw new UnauthorizedError("Unauthorized");
      }
    } else {
      throw new UnauthorizedError("Unauthorized");
    }
  } catch (err) {}
});

//update availability
router.put('/update-availability', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let me = req.session.Me;
    if(me && me.username && me.username.length > 0){
      const availabilityId = req.body.availabilityId;
      let addTimeSlots: { startTime: Date, endTime: Date }[] = req.body.newTimeSlots;
      let removeTimeSlots: {startTime: Date, endTime: Date}[] = req.body.removeTimeSlots;
      const date = new Date (req.body.date);
      const weekDay = req.body.weekDay;
        // Ensure addTimeSlots and removeTimeSlots are arrays
        if (!Array.isArray(addTimeSlots)) {
          addTimeSlots = [];
        }
        if (!Array.isArray(removeTimeSlots)) {
          removeTimeSlots = [];
        }
      //find availability by id
      const findAvailability = await getAvailabilityById(ensureObjectId(availabilityId));
      if(findAvailability){
        //update availability
      const availability = await updateAvailability(ensureObjectId(availabilityId), date, weekDay, addTimeSlots, removeTimeSlots); 
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
});
//DELETE availability
router.delete('/delete-availability/:id', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let me = req.session.Me;
    if(me && me.username && me.username.length > 0){
      const availabilityId = req.params.id;
      const availability = await getAvailabilityById(ensureObjectId(availabilityId));
      if(availability){
        const result = await deleteAvailability(ensureObjectId(availabilityId));
        res.json({message: "Availability deleted", success: true});
      } else {
        throw new BadRequestError("Something went wrong when deleting availability");
      }
    } else {
      throw new UnauthorizedError("Unauthorized");
    }
  } catch (err) {
    next(err);
  }
});
export default router;