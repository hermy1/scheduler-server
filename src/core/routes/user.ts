import express, { Request, Response, NextFunction, Router } from "express";
import { Me } from "../models/me";
import { getAllUsers } from "../models/user";
// import bycrpt from "bcrypt";


const router: Router = express.Router();
//test route
router.get("/ping", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session.Me) {
      console.log(req.session.Me);
    } else {
      let me = new Me();
      me.username = "student";
      me.isStudent = true;
      req.session.Me = me;
      res.json("pong");
    }
    res.json("done");
  } catch (err) {
    console.log(err);
  }
});


//get all users
router.get("/all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session.Me && req.session.Me.isProfessor) {
      let users = await getAllUsers();
      res.json(users);
    } else {
      res.json("You must be an admin that is logged in");
    }
  } catch (err) {
    console.log("error: ", err);
  }
});


export default router;