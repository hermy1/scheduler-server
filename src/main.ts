//entry
import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import * as http from "http";
import config from "./core/config";
import { Me } from "./models/me";
import session from "express-session";
import userRoutes from './routes/user'
import professorRoutes from "./routes/professor";
import MongoStore from "connect-mongo";
import cors from "cors";
import { UserError } from "./core/errors/base";

interface MainOptions {
  port: number;
}

//express session
declare module "express-session" {
  interface SessionData {
    Me: Me;
  }
}

//main entry
export async function main(options: MainOptions) {
  try {
    const app = express();
    //Mongo store for session in db
    const mongoStore = MongoStore.create({
      mongoUrl: config.server.mongoConnect,
      collectionName: "sessions",
    })
    //set body parser and limit size for attacks
    app.use(bodyParser.json({ limit: "5mb" }));
    // for parsing application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ limit: "5mb", extended: false }));
    const sess = session({
      secret: config.server.secret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 86400000 },
      //call mongo store for session
      store: mongoStore
    });
    //set up cors 
    app.use(
        cors({
          origin: config.corsOrigin,
          credentials: true,
        })
    );
    console.log(        config.corsOrigin
    );
    //set session
    app.use(sess);

    //set routes
    app.use("/user", userRoutes);

    //professor routes
    app.use("/professor", professorRoutes);
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.log('err',err);
      if (err instanceof UserError) {
        //Need to send the error down to the user
        res.status(err.statusCode).send({ message: err.message });
      } else {
        res.status(500).send({message: err.message});
      }

      const errMsg = err.message;

    });

    //sample hello world route
    app.get("/", (req: Request, res: Response, next: NextFunction) => {
      res.json("Hello world, Root route");
    });

    //start server
    const server = http.createServer(app);
    server.listen(options.port);
  } catch (err) {}
}

if (require.main === module) {
  const PORT = 7000;
  main({ port: PORT })
      .then(() => {
        console.log(`Server is running at http://localhost:${PORT}`);
      })
      .catch((err) => {
        console.log("Something went wrong");
      });
}