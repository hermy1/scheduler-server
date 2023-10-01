//middleware 
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/usert';

//if user is loggedin 
export const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const me = req.session.Me;
        if (me && me.username && me.username.length > 0) {
            next();
        } else {
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
        if (me && me.isStudent) {
            next();
        } else {
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
        if (me && me.isProfessor) {
            next();
        } else {
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