
import express, { Request, Response, NextFunction, Router } from "express";
import { Me } from "../../models/me";
import { isLoggedIn, isProfessor, isStudent } from "../middleware/auth";
import { checkIfUserExists, getAllProfessors, getUserbyUsername } from "../../mongo/queries/users";


const router: Router = express.Router();

//get all adivisors
router.get('/advisors', async (req: Request, res: Response, next: NextFunction) => 
{
    try 
    {
        res.json('Successful get advisor')
    } catch(err)
    
    {
        console.log(err);
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