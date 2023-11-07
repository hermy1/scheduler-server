
import express, { Request, Response, NextFunction, Router } from "express";
import { Me } from "../../models/me";
import { isLoggedIn, isProfessor, isStudent } from "../middleware/auth";
import { checkIfUserExists, getAggregates, getAllProfessors, getAllStudents, getUserbyUsername } from "../../mongo/queries/users";
import { addStudentToAdvisor, insertNewCourse, insertStudentCourse } from "../../mongo/mutations/professor";
import { BadRequestError, UnauthorizedError } from "../errors/user";
import { ensureObjectId } from "../config/utils/mongohelper";


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

export default router;