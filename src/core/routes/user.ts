import express, { Request, Response, NextFunction, Router } from "express";
import { Me } from "../../models/me";
import { isLoggedIn, isProfessor, isStudent } from "../middleware/auth";
import { checkIfUserExists, getProfessorsByUserId, getAdvisorsByUserId, getUpcomingMeetings, getUserbyEmail, getUserbyId, getUserbyUsername } from "../../mongo/queries/users";
import { changePassword, insertNewUser, resetPassword } from "../../mongo/mutations/users";
import bycrpt, { genSaltSync, hashSync } from "bcrypt";
import { User, UserRole } from "../../models/user";
import { MongoInsertError } from "../errors/mongo";
import { getAllStudents, getAllProfessors } from "../../mongo/queries/users";
import { BadRequestError, UnauthorizedError } from "../errors/user";
import { checkIfCodeMatches, resendEmailAuthCode, sendEmailAuthCode } from '../../mongo/queries/code';
import { checkPasswordComplexity } from "../config/utils/password-complexity";
import { ServerError } from "../errors/base";
import { cancelAppointment, createAppointment } from "../../mongo/mutations/appointment";
import { ensureObjectId } from "../config/utils/mongohelper";
import { AppointmentStatus } from "../../models/appointment";
import { ObjectId } from "mongodb";

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
        let me = new Me();
        me.username = username;
        me.role = user.role;
        req.session.Me = me;        
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
router.post(
  "/profile",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      if (me) {
        let user = await getUserbyUsername(me.username);
        res.json(user);
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



//send code to user to reset their password
router.post('/sendcode', async (req: Request, res: Response, next: NextFunction) => {
  try {
      let email = req.body.email?.toString();
      let user = (await getUserbyEmail(email));
      if (email && user){
      if (user.email == email){
        let sendCode = await sendEmailAuthCode(user._id.toString(),email);
        if (sendCode){
          res.json({message:'You code was successfully sent', userId: user._id});
        } else {
          res.json({message: "Could not send code"});
          throw new Error("Could not send code");
        }
      } else {
        res.json({message: "Email does not match our database"});
        throw new Error("Email does not match our database");
      }
    } else {
      res.json({message: "Invalid information"});
      throw new Error("Invalid information");
    }
  } catch (err) {
      next(err);
  }
});

//compare code from databse to what the user entered to reset their password
router.post('/comparecode', async (req: Request, res: Response, next: NextFunction) => {
  try {
      let code = req.body.code?.toString();
      let userId = req.body.userId?.toString();

      if (userId && code) {
          let codeMatches = await checkIfCodeMatches(userId, code);
          if (codeMatches) {
            let user = await getUserbyId(userId);
            let me = new Me();
            me.username = user.username;
            me.role = user.role;
            req.session.Me = me;
            res.json({message: "Your code matches"});
            //can then change password

          } else {
            res.json({message: "The code is not correct"});
            throw new Error("That code is not correct");
          }
      } else {
        res.json({message: "Invalid information"});
        throw new Error("Invalid information");
      }
  } catch (err) {
      next(err);
  }
});

//resend code to user to reset their password if they never received it
router.post('/resendcode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let email = req.body.email.toString();
    if (email){

        let user = await getUserbyEmail(email);
        if (email == user.email){

          let sendCode = await resendEmailAuthCode(user._id.toString(),email);
          if (sendCode){
            res.json({message:'You code was successfully resent'})

          } else {
            res.json({message: "Could not resend code"});
            throw new Error("Could not resend code");
          }
        }else {
          res.json({message: "Your email doesn't match our database"});
          throw new Error("Your email doesn't match our database");
        }
      } else {
        res.json({message: "Invalid information"});
        throw new Error("Invalid information");
      }
  } catch (err) {
      next(err);
  }
});

//reset password after verifying with code
router.post("/resetPassword", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const me = req.session.Me;
    let newPassword1 = req.body.newPassword1.toString();
    let newPassword2 = req.body.newPassword2.toString();
    if (me){
      if (newPassword1 == newPassword2){
        let passcomplexity = await checkPasswordComplexity(newPassword1);
        if (passcomplexity){
          let userId = (await getUserbyUsername(me.username))._id;
          let update = await resetPassword(userId.toString(),newPassword1);
          if (update){
            res.json({message:'You successfully reset your password'})
          } else{
            res.json({message: "Something went wrong with reseting your password"});
            throw new Error("Something went wrong with reseting your password");
          }}
          else{
            res.json({message:"Your password doesn't meet the requirements"})
            throw new Error("Password is not complex enough");
          }
        } else {
          res.json({message: "Your passwords don't match"});
          throw new Error("Passwords do not match");
        }
    } else{ 
      res.json({message: "You are not authorized"});
      throw new UnauthorizedError(`You are not authorized`);
    }
  } catch (err) {
    next(err);
  }
});

router.post('/changepassword', isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
  try {
      const me = req.session.Me;
      const oldPassword = req.body.oldPassword.toString();
      const newPassword1 = req.body.newPassword1.toString();
      const newPassword2 = req.body.newpassword2.toString();
      if (me) {
          if (newPassword1 == newPassword2) {
              let complexity = await checkPasswordComplexity(newPassword1)
              if (complexity) {
                let userId = (await getUserbyUsername(me.username))._id;
                let insertPassword = await changePassword(me.username,userId.toString(), oldPassword,newPassword1);
                if (insertPassword) {
                    req.session.destroy((err) => { });
                    res.json( "Your password is changed." );
                } else {
                  res.json({message: "Something went wrong when changing password`"});
                  throw new ServerError(`Something went wrong when changing password`);
                }                                     
              } else {
                res.json({message: "The password doesn't meet the requirements"});
                throw new BadRequestError("The password doesn't meet the requirements");
              }
          } else {
            res.json({message: "The passwords don't match"});
            throw new BadRequestError("The passwords don't match");
          }
        } else {
          res.json({message: "You are not authorized"});
          throw new UnauthorizedError(`You are not authorized`);
          }
  } catch (err) {
      next(err);
  }
});

router.post('/createAppointment', isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
  try {
      const me = req.session.Me;
      const professorId = req.body.professorId.toString();
      const startTime = req.body.startTime.toString();
      const endTime = req.body.endTime.toString();
      const advisor = req.body.advisor.toString();
      let guestId:string="";
      if (req.body.guestId){
        guestId = req.body.guestId.toString();
      } else {
        guestId = ""
      }
      let reason:string="";
      if (req.body.reason){
        reason = req.body.reason.toString();
      } else {
        reason = ""
      }



      if (me) {
        let userId = await (await getUserbyUsername(me?.username))._id;

          if (professorId && startTime && endTime && advisor) {
            let createAppointent = await createAppointment(userId.toString(),professorId,startTime,endTime,advisor,reason,guestId);
              if (createAppointent){
                res.json(createAppointent);
              } else {
                res.json({message: "Something went wrong when creating a new appointment"});
                throw new BadRequestError("Something went wrong when creating a new appointment")
              }
        } else {
          res.json({message: "Please send up all the information"});
          throw new BadRequestError("Please send up all the information")
        }
      }
        else {
          res.json({message: "You are not authorized"});
          throw new UnauthorizedError(`You are not authorized`);
          }
  } catch (err) {
      next(err);
  }
});

router.post('/resendcode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let email = req.body.email.toString();
    if (email){

        let user = await getUserbyEmail(email);
        if (email == user.email){

          let sendCode = await resendEmailAuthCode(user._id.toString(),email);
          if (sendCode){
            res.json({message:'You code was successfully resent'})

          } else {
            res.json({message: "Could not resend code"});
            throw new Error("Could not resend code");
          }
        }else {
          res.json({message: "Your email doesn't match our database"});
          throw new Error("Your email doesn't match our database");
        }
      } else {
        res.json({message: "Invalid information"});
        throw new Error("Invalid information");
      }
  } catch (err) {
      next(err);
  }
});

router.post("/cancelAppointment", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const me = req.session.Me;
    let appointmentId = req.body.appointmentId.toString();
    console.log(appointmentId);
 
    if (me){
       let cancelApt = await cancelAppointment(appointmentId);
       if (cancelApt){
        res.json({message: "Your appointment was successfully cancelled"});
       } else {
        res.json({message: "Something went wrong when cancelling your appointment"});
        throw new BadRequestError(`Something went wrong when cancelling your appointment`);
       }
       
    } else{ 
      res.json({message: "You are not authorized"});
      throw new UnauthorizedError(`You are not authorized`);
    }
  } catch (err) {
    next(err);
  }
});



//fetch all upcoming meetings
router.get('/upcoming', isLoggedIn, isStudent, async(req:Request, res:Response, next: NextFunction)=>{
  try {
    const me = req.session.Me;
    if (me){
      let studentId = (await getUserbyUsername(me.username))._id;
      const status = AppointmentStatus.Accepted;
    if(studentId){
      const meetings = await getUpcomingMeetings(ensureObjectId(studentId), status);
    res.json(meetings);
    } else {
      res.json({message: "Something went wrong when getting upcoming meetings"});
      throw new BadRequestError("Something went wrong when getting upcoming meetings");
    } 
    
  } else {
    res.json({message: "You are not authorized"});
    throw new UnauthorizedError(`You are not authorized`);
  }
  } catch (err) {
    next(err);
  }
});
router.post("/getAdvisorsById", isLoggedIn, isStudent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const me = req.session.Me;

    if (me){
      let id = (await getUserbyUsername(me.username))._id;
     let professors = await getAdvisorsByUserId(id);
     if (professors){
      res.json(professors);
     } else {
      res.json('Something went wrong and could not get your advisors');
     }

    } else{ 
      res.json({message: "You are not authorized"});
      throw new UnauthorizedError(`You are not authorized`);
    }
  } catch (err) {
    next(err);
  }
});
router.post("/getAdvisorsById", isLoggedIn, isStudent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const me = req.session.Me;

    if (me){
      let id = (await getUserbyUsername(me.username))._id;
     let professors = await getAdvisorsByUserId(id);
     if (professors){
      res.json(professors);
     } else {
      res.json('Something went wrong and could not get your advisors');
     }

    } else{ 
      res.json({message: "You are not authorized"});
      throw new UnauthorizedError(`You are not authorized`);
    }
  } catch (err) {
    next(err);
  }
});

router.post("/getProfessorsById", isLoggedIn, isStudent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const me = req.session.Me;
 
    if (me){
      let id = (await getUserbyUsername(me.username))._id;
     let professors = await getProfessorsByUserId(id);
     if (professors){
      res.json(professors);
     } else {
      res.json('Something went wrong and could not get your professors');
     }
       
    } else{ 
      res.json({message: "You are not authorized"});
      throw new UnauthorizedError(`You are not authorized`);
    }
  } catch (err) {
    next(err);
  }
});



export default router;