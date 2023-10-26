//middleware 
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/user';
import { User, UserRole } from '../../models/user';

//if user is loggedin 
export const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const me = req.session.Me;
        if (me && me.username && me.username.length > 0) {
            next();
        } else {
            res.json ('Unauthorized')
            throw new UnauthorizedError("Unauthorized");
        }
    } catch (err) {
        //we destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            }
        });
        next(err);
    }
};

//check if user is a student
export const isStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const me = req.session.Me;
        if (me && me.role === UserRole.Student) {
            next();
        } else {
            res.json ('Unauthorized')
            throw new UnauthorizedError("Unauthorized");
        }
    } catch (err) {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            }
        });
        next(err);
    }
};

//check if user is a professor
export const isProfessor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const me = req.session.Me;
        if (me && me.role === UserRole.Professor) {
            next();
        } else {
            res.json ('Unauthorized')
            throw new UnauthorizedError("Unauthorized");
        }
    } catch (err) {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            }
        });
        next(err);
    }
};