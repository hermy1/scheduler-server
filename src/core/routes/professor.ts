
import express, { Request, Response, NextFunction, Router } from "express";
import { Me } from "../../models/me";
import { isLoggedIn, isProfessor, isStudent } from "../middleware/auth";
import { checkIfUserExists, getUserbyUsername } from "../../mongo/queries/users";


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


export default router;