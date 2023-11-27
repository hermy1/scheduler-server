import express, { Request, Response, NextFunction, Router } from "express";
import { Me } from "../models/me";
import { isLoggedIn, isProfessor, isStudent } from "../core/middleware/auth";
import {
  checkIfUserExists,
  getProfessorByUserId,
  getProfessorsByUserId,
  getAdvisorsByUserId,
  getUpcomingMeetings,
  getUserbyEmail,
  getUserbyId,
  getUserbyUsername,
  getProfessorsAdvisorsByUserId,
  getProfessorsAdvisorsByUserIdButOne,
  getUserInfo,
  checkIfEmailExists,
  getProfessorInfoByProfessorId,
} from "../mongo/queries/users";
import {
  changePassword,
  insertNewUser,
  resetPassword,
  updateUserInfo,
} from "../mongo/mutations/users";
import bycrpt, { genSaltSync, hashSync } from "bcrypt";
import { User, UserRole } from "../models/user";
import { MongoInsertError } from "../core/errors/mongo";
import { getAllStudents, getAllProfessors } from "../mongo/queries/users";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../core/errors/user";
import {
  checkIfCodeMatches,
  resendEmailAuthCode,
  sendEmailAuthCode,
} from "../mongo/queries/code";
import { checkPasswordComplexity } from "../core/config/utils/password-complexity";
import { ServerError } from "../core/errors/base";
import {
  cancelAppointment,
  createAppointment,
} from "../mongo/mutations/appointment";
import { getAppointmentbyId } from "../mongo/queries/appointment";
import { ensureObjectId } from "../core/config/utils/mongohelper";
import { AppointmentStatus } from "../models/appointment";
import { ObjectId } from "mongodb";
import {
  createNotification,
  readNotification,
} from "../mongo/mutations/notification";
import {
  allNotifications,
  getNotification,
} from "../mongo/queries/notification";
import { getAvailabilityListByProfessorId } from "../mongo/queries/availability";
import { removeTimeSlot } from "../mongo/mutations/availability";

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

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      username, 
      email,
      role,
      firstName,
      lastName,
      password,
      confirmPassword 

    } = req.body;
    const checkUser = await checkIfEmailExists(email);
    const checkUsername = await checkIfUserExists(username);
    if(!checkUser && !checkUsername) {
      if(password === confirmPassword) {
        const salt = genSaltSync(10);
        const hashedPassword = hashSync(password, salt);
        const newUser = new User();
        newUser.username = username;
        newUser.email = email;
        newUser.role = role;
        newUser.firstName = firstName;
        newUser.lastName = lastName;
        newUser.password = hashedPassword;
        newUser.createdAt = new Date();
        newUser.updatedAt = new Date();
        const result = await insertNewUser(
          newUser.username,
          newUser.email,
          newUser.role,
          newUser.firstName,
          newUser.lastName,
          newUser.password
        );
        //send code to email using userId and email
        let sendCode = await sendEmailAuthCode(result._id.toString(), email.toString());
        if (sendCode) {
          res.json({ message: "A verification code was sent to your email", result }); 
        } else {
          throw new ServerError("Could not send code"); 
        }
      } else {
        throw new BadRequestError("Passwords do not match");
      }
    } else {
      res.status(400).json({ message: "It looks like you already have an account with us"});
      throw new MongoInsertError("Email already exists");
    }
  } catch (err) {
    next(err);
  }
}) 

//add info to user (register flow)
router.put('/updateinfo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      userId,
      role,
      major,
      minor,
      department,
      grade,
      gender,
      title,
      birthdate,
      avatar
    } = req.body;
    const user = await getUserbyId(userId);
    if(user){
      if(role === UserRole.Student){
        user.major = major;
        user.minor = minor;
        user.grade = grade;
        user.avatar = avatar;
        user.gender = gender;
        user.birthdate = new Date(birthdate);
        user.updatedAt = new Date();
        user.isVerified = true;
        const result = await updateUserInfo(user);
        if(result){
          res.json({ message: "Student Profile updated successfully", result });
        } else {
          throw new MongoInsertError("Something went wrong when updating user");
        }
      } else if(role === UserRole.Professor){
        user.department = department;
        user.title = title;
        user.avatar = avatar;
        user.birthdate = new Date(birthdate);
        user.gender = gender;
        user.updatedAt = new Date();
        user.isVerified = true;  
        const result = await updateUserInfo(user);
        if(result){
          res.json({ success: true,  message: "Profile updated successfully"});
        } else {
          throw new MongoInsertError("Something went wrong when updating user");
        }
      } else {
        throw new MongoInsertError("Role does not exist");
      }
    } else {
      res.status(404).json({ message: "This is strange, but you don't exist here, signup" });
      throw new MongoInsertError("User does not exist");
    }
  } catch (err) {
    next(err);
  }
});

//login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    let user: User;
    try {
      user = await getUserbyUsername(username);
    } catch (err) {
      throw new NotFoundError('Username is incorrect try again');  
    }
    const isPasswordCorrect = bycrpt.compareSync(password, user.password);
    if (isPasswordCorrect) {
      let me = new Me();
      me.username = username;
      me._id = user._id;
      me.role = user.role;
      req.session.Me = me;
      let userInfo = await getUserInfo(req.session.Me._id);
      res.json({ success: true, user: userInfo });
    } else {
      throw new NotFoundError('Password is incorrect try again'); 
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

//get all students TODO: Remove senstive information
router.get(
  "/students",
  isLoggedIn,
  isProfessor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const students = await getAllStudents();
      res.json(students);
    } catch (err) {
      next(err);
    }
  }
);

//send code to user to reset their password
router.post(
  "/sendcode",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let email = req.body.email?.toString();
      let user = await getUserbyEmail(email);
      if (email && user) {
        if (user.email == email) {
          let sendCode = await sendEmailAuthCode(user._id.toString(), email);
          if (sendCode) {
            res.json({
              message: "You code was successfully sent",
              userId: user._id,
            });
          } else {
            res.json({ message: "Could not send code" });
            throw new Error("Could not send code");
          }
        } else {
          res.json({ message: "Email does not match our database" });
          throw new Error("Email does not match our database");
        }
      } else {
        res.json({ message: "Invalid information" });
        throw new Error("Invalid information");
      }
    } catch (err) {
      next(err);
    }
  }
);

//compare code from databse to what the user entered to reset their password
router.post(
  "/comparecode",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let code = req.body.code?.toString();
      let userId = req.body.userId?.toString();

      if (userId && code) {
        let codeMatches = await checkIfCodeMatches(userId, code);
        if (codeMatches) {
          const user = await getUserbyId(userId);
          if(user){
              user.isVerified = true;
              const result = await updateUserInfo(user);
              if(result){
            let me = new Me();
          me.username = user.username;
          me.role = user.role;
          me._id = user._id;
          req.session.Me = me;
          //user role and userid, username send back to front end
          res.json({ message: "Your code matches", user: me }); 
          //can then change password
              } else{
                throw new ServerError("Something went wrong while verifying user"); 
              }
       
        } else{
          throw new NotFoundError("That user does not exist");  
        }
        }else {
         
          throw new BadRequestError("That code is not correct");
        }
      } else {
      
        throw new BadRequestError("Invalid information");
      }
    } catch (err) {
      next(err);
    }
  }
);

//resend code to user to reset their password if they never received it
router.post(
  "/resendcode",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let email = req.body.email.toString();
      if (email) {
        let user = await getUserbyEmail(email);
        if (email == user.email) {
          let sendCode = await resendEmailAuthCode(user._id.toString(), email);
          if (sendCode) {
            res.json({ message: "You code was successfully resent", user: user });
          } else {
            res.json({ message: "Could not resend code" });
            throw new Error("Could not resend code");
          }
        } else {
          res.json({ message: "Your email doesn't match our database" });
          throw new Error("Your email doesn't match our database");
        }
      } else {
        res.json({ message: "Invalid information" });
        throw new Error("Invalid information");
      }
    } catch (err) {
      next(err);
    }
  }
);

//reset password after verifying with code
router.post(
  "/resetPassword",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      let newPassword1 = req.body.newPassword1.toString();
      let newPassword2 = req.body.newPassword2.toString();
      if (me) {
        if (newPassword1 == newPassword2) {

            let userId = (await getUserbyUsername(me.username))._id;
            let update = await resetPassword(userId.toString(), newPassword1);
            if (update) {
              res.json({ message: "You successfully reset your password" });
            } else {
              res.json({
                message: "Something went wrong with reseting your password",
              });
              throw new Error(
                "Something went wrong with reseting your password"
              );
            }
          
        } else {
          res.json({ message: "Your passwords don't match" });
          throw new Error("Passwords do not match");
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

router.post(
  "/changepassword",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      const oldPassword = req.body.oldPassword.toString();
      const newPassword1 = req.body.newPassword1.toString();
      const newPassword2 = req.body.newpassword2.toString();
      if (me) {
        if (newPassword1 == newPassword2) {

            let userId = (await getUserbyUsername(me.username))._id;
            let insertPassword = await changePassword(
              me.username,
              userId.toString(),
              oldPassword,
              newPassword1
            );
            if (insertPassword) {
              req.session.destroy((err) => {});
              res.json("Your password is changed.");
            } else {
              res.json({
                message: "Something went wrong when changing password`",
              });
              throw new ServerError(
                `Something went wrong when changing password`
              );
            }
          } else {
            res.json({ message: "The password doesn't meet the requirements" });
            throw new BadRequestError(
              "The password doesn't meet the requirements"
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

router.post(
  "/createAppointment",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      const professorId = req.body.professorId.toString();
      const startTime = req.body.startTime.toString();
      const endTime = req.body.endTime.toString();
      const advisor = req.body.advisor.toString();
      const timeArrayId = req.body.availabilityId.toString();

      let guestId: string = "";
      if (req.body.guestId) {
        guestId = req.body.guestId.toString();
      } else {
        guestId = "";
      }
      let reason: string = "";
      if (req.body.reason) {
        reason = req.body.reason.toString();
      } else {
        reason = "";
      }
      if (me) {
        let userId = await (await getUserbyUsername(me?.username))._id;

        if (professorId && startTime && endTime && advisor) {
          let createAppointent = await createAppointment(
            userId.toString(),
            professorId,
            startTime,
            endTime,
            advisor,
            reason,
            guestId,  timeArrayId
          );
          if (createAppointent) {
            //remove timeslot from database:
            let remove = await removeTimeSlot(professorId,timeArrayId,{startTime,endTime});
            if(remove){
              res.json(createAppointent);

            } else {
              throw new BadRequestError('Something went wrong while removing time slot');
            }
          } else {
  
            throw new BadRequestError(
              "Something went wrong when creating a new appointment"
            );
          }
        } else {
          throw new BadRequestError("Please send up all the information");
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
  "/resendcode",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let email = req.body.email.toString();
      if (email) {
        let user = await getUserbyEmail(email);
        if (email == user.email) {
          let sendCode = await resendEmailAuthCode(user._id.toString(), email);
          if (sendCode) {
            res.json({ message: "You code was successfully resent" });
          } else {
            res.json({ message: "Could not resend code" });
            throw new Error("Could not resend code");
          }
        } else {
          res.json({ message: "Your email doesn't match our database" });
          throw new Error("Your email doesn't match our database");
        }
      } else {
        res.json({ message: "Invalid information" });
        throw new Error("Invalid information");
      }
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/cancelAppointment",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      let appointmentId = req.body.appointmentId.toString();
      console.log(appointmentId);

      if (me) {
        let cancelApt = await cancelAppointment(appointmentId);
        if (cancelApt) {
          res.json({ message: "Your appointment was successfully cancelled" });
        } else {
          res.json({
            message: "Something went wrong when cancelling your appointment",
          });
          throw new BadRequestError(
            `Something went wrong when cancelling your appointment`
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

//fetch all upcoming meetings
router.get(
  "/upcoming",
  isLoggedIn,
  isStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      if (me) {
        let studentId = (await getUserbyUsername(me.username))._id;
        const status = AppointmentStatus.Accepted;
        if (studentId) {
          const meetings = await getUpcomingMeetings(
            ensureObjectId(studentId),
            status
          );
          res.json(meetings);
        } else {
          res.json({
            message: "Something went wrong when getting upcoming meetings",
          });
          throw new BadRequestError(
            "Something went wrong when getting upcoming meetings"
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
router.post(
  "/getAdvisorsById",
  isLoggedIn,
  isStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;

      if (me) {
        let id = (await getUserbyUsername(me.username))._id;
        let professors = await getAdvisorsByUserId(id);
        if (professors) {
          res.json(professors);
        } else {
          res.json("Something went wrong and could not get your advisors");
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
router.post(
  "/getAdvisorsById",
  isLoggedIn,
  isStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;

      if (me) {
        let id = (await getUserbyUsername(me.username))._id;
        let professors = await getAdvisorsByUserId(id);
        if (professors) {
          res.json(professors);
        } else {
          res.json("Something went wrong and could not get your advisors");
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
router.post(
  "/getAdvisorsById",
  isLoggedIn,
  isStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;

      if (me) {
        let id = (await getUserbyUsername(me.username))._id;
        let professors = await getAdvisorsByUserId(id);
        if (professors) {
          res.json(professors);
        } else {
          res.json("Something went wrong and could not get your advisors");
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
  "/getAdvisorsById",
  isLoggedIn,
  isStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;

      if (me) {
        let id = (await getUserbyUsername(me.username))._id;
        let professors = await getAdvisorsByUserId(id);
        if (professors) {
          res.json(professors);
        } else {
          res.json("Something went wrong and could not get your advisors");
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
  "/getProfessorsById",
  isLoggedIn,
  isStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;

      if (me) {
        let id = (await getUserbyUsername(me.username))._id;
        let professors = await getProfessorsByUserId(id);
        if (professors) {
          res.json(professors);
        } else {
          res.json("Something went wrong and could not get your professors");
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

router.post(
  "/getProfessorById",
  isLoggedIn,
  isStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      let professorId = req.body.professorId.toString();

      if (me) {
        let professor = await getProfessorByUserId(professorId);
        if (professor) {
          res.json(professor);
        } else {
          res.json("Something went wrong and could not get a professor");
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

router.post(
  "/createNotification",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      let userId = req.body.userId.toString();
      let title = req.body.title.toString();
      let description = req.body.description.toString();

      if (me) {
        let notification = await createNotification(userId, title, description);
        if (notification) {
          res.json(notification);
        } else {
          res.json("Something went wrong and could not create a notification");
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
  "/getProfessorsAdvisors",
  isLoggedIn,
  isStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;

      if (me) {
        let id = (await getUserbyUsername(me.username))._id;
        let all = await getProfessorsAdvisorsByUserId(id);
        if (all) {
          res.json(all);
        } else {
          res.json(
            "Something went wrong when getting advisors and professors for student"
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

router.post(
  "/readNotification",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      let notificationId = req.body.notificationId.toString();

      if (me) {
        let notification = await readNotification(notificationId);
        if (notification) {
          res.json(notification);
        } else {
          res.json("Something went wrong and could not update a notification");
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

//get all professors but the id sent up
router.post(
  "/getProfessorsAdvisorsButOne",
  isLoggedIn,
  isStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      let professorId:string = req.body.professorId.toString();
      if (me) {
        console.log(me,professorId);
        let id = (await getUserbyUsername(me.username))._id;
        let all = await getProfessorsAdvisorsByUserIdButOne(id, ensureObjectId(professorId));
        if (all) {
          res.json(all);
        } else {
          throw new Error("Something went wrong when getting advisors and professors for student");            
          
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
  "/professorAvailability",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      let professorId= req.query.professorId;
      if (me && me.username && me.username.length > 0) {
        if (professorId) {
          const availability = await getAvailabilityListByProfessorId(
            ensureObjectId(professorId.toString())
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
  });


router.post(
  "/notificationById",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      let notificationId = req.body.notificationId.toString();

      if (me) {
        let notification = await getNotification(notificationId);
        if (notification) {
          res.json(notification);
        } else {
          res.json("Something went wrong and could not get a notification");
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
  "/notificationsForUser",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;

      if (me) {
        let id = (await getUserbyUsername(me.username))._id;
        let notifications = await allNotifications(id);
        if (notifications) {
          res.json(notifications);
        } else {
          res.json("Something went wrong and could not get notifications");
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
  "/getAppointmentbyId",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let appId = req.query.id?.toString();
      let me = req.session.Me;
      if (me) {
        if (appId) {
          const getAppointment = await getAppointmentbyId(appId);
          if (getAppointment) {
            res.json(getAppointment);
          } else {
            res.json(
              "Something went wrong and could not retreieve the appointment"
            );
          }
        } else {
          res.json({ message: "You did not send up an appointmentId" });
          throw new BadRequestError(`You did not send up an appointmentId`);
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
  "/professorAvailability",
  isLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let me = req.session.Me;
      let professorId= req.query.professorId;
      if (me && me.username && me.username.length > 0) {
        if (professorId) {
          const availability = await getAvailabilityListByProfessorId(
            ensureObjectId(professorId.toString())
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
  });

  router.post('/logout', isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = req.session.Me;
      if(me) {
        req.session.destroy((err) => {
          if(err) {
            res.json({ message: "Something went wrong when logging out" });
            throw new UnauthorizedError(`Something went wrong when logging out`);
          } else {
            res.json({ succces:true, message: "You are logged out" });
          }
        })
      }
    } catch (err) {
      next(err);
    }
  });

  router.get("/professor-info", isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const professorId = req.query.professorId;
      if(professorId) {
        const info = await getProfessorInfoByProfessorId(professorId.toString());
        if(info) {
          res.json(info);
        } else {
          throw new BadRequestError("Something went wrong grabbing the professr's info");
        }
      } else {
        throw new BadRequestError("URI cannot be empty");
      }
    } catch (err) {
      next(err);
    }
  });

export default router;
