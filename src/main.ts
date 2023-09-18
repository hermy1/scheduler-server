//entry
import express, {Request, Response, NextFunction} from 'express';
import bodyParser from 'body-parser';
import * as http from 'http';
import config from './core/config';
import { Me } from './core/models/me';
import session from 'express-session';
import userRoutes from './core/routes/user';


interface MainOptions {
    port: number;
}

//express session
declare module 'express-session' {
    interface SessionData {
        Me: Me;
    }
}

//main entry
export async function main (options: MainOptions){
    try{
        const app = express();
        //set body parser and limit size for attacks
        app.use(bodyParser.json({ limit: "5mb" }));
        // for parsing application/x-www-form-urlencoded
        app.use(bodyParser.urlencoded({ limit: "5mb", extended: false }));
        const sess = session({
          secret: config.server.secret,
          resave: false,
          saveUninitialized: false,
          cookie: { secure: false, maxAge: 6000000 },
        });
        //set session
        app.use(sess);
        //set routes
        app.use('/user', userRoutes);
        
        //sample hello world route 
        app.get('/', (req: Request, res: Response, next: NextFunction) => {
            res.json('Hello world');
        });

    //start server
    const server = http.createServer(app);
    server.listen(options.port);
  } catch (err) {}
}

if (require.main === module) {
    const PORT = 7000;
    main({port: PORT}).then(() => {
        console.log(`Server is running at http://localhost:${PORT}`);
    }).catch((err) => {
       console.log('Something went wrong');
    });
}
