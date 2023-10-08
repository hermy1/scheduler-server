import express, { Request, Response, NextFunction, Router } from "express";
import { Me } from "../../models/me";
import { isLoggedIn, isProfessor, isStudent } from "../middleware/auth";
import { checkIfUserExists, getUserbyUsername } from "../../mongo/queries/users";
import { insertNewUser } from "../../mongo/mutations/users";
import bycrpt, { genSaltSync, hashSync } from "bcrypt";
import { User, UserRole } from "../../models/user";
import { MongoInsertError } from "../errors/mongo";
import { getAllStudents, getAllProfessors } from "../../mongo/queries/users";

const router: Router = express.Router();
//test route
router.get("/ping", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session.Me) {
      console.log(req.session.Me);
    } else {
      let me = new Me();
      me.username = "student";
      me.role = UserRole.Student;
      req.session.Me = me;
      res.json("pong");
    }
    res.json("done");
  } catch (err) {
    console.log(err);
  }
});

//add new user
router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        username,
        password,
        email,
        role,
        major,
        minor,
        department,
        title,
        grade,
        gender,
        birthdate,
      } = req.body;

      //check if user exists
      const user = await checkIfUserExists(username);

      if (!user) {
        const salt = genSaltSync(10);
        const hashedPassword = hashSync(password, salt);
        const newUser = new User();
        newUser.username = username;
        newUser.password = hashedPassword;
        newUser.email = email;
        newUser.role = role;
        newUser.major = major;
        newUser.minor = minor;
        newUser.department = department;
        newUser.title = title;
        newUser.grade = grade;
        newUser.gender = gender;
        newUser.birthdate = new Date(birthdate);
        newUser.createdAt = new Date();
        newUser.updatedAt = new Date();

        const result = await insertNewUser(
          newUser.username,
          hashedPassword,
          newUser.role,
          newUser.email,
          newUser.major,
          newUser.minor,
          newUser.department,
          newUser.grade,
          newUser.gender,
          newUser.title,
          newUser.birthdate
        );
        res.json({ message: "User created successfully", result });
      } else {
        res.json({ message: "username already exists" });
        throw new MongoInsertError("User already exists");
      }
    } catch (err) {
      next(err);
    }
  }
);

//login 
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const user = await getUserbyUsername(username);
    if(user) {
      const isPasswordCorrect = bycrpt.compareSync(password, user.password);
      if(isPasswordCorrect) {
        req.session.Me = user;
        console.log(req.session.Me);
        res.json({message: "Login successful", Me: req.session.Me.role});
      } else {
        res.json({message: "Password is incorrect"});
        throw new Error("Password is incorrect");
      }
    }
  } catch (err) {
    next(err);
  }
});

//profile
router.get(
  "/profile",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      if (me) {
        res.json(me);
      } else {
        throw new Error("Unauthorized");
      }
    } catch (err) {
      next(err);
    }
  }
);

//get all students
router.get('/students', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const students = await getAllStudents();
    res.json(students);
  } catch (err) {
    next(err);
  }
});

//get all professors
router.get('/professors', isLoggedIn, isProfessor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const professors = await getAllProfessors();
    res.json(professors);
  } catch (err) {
    next(err);
  }
});


export default router;
