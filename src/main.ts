//entry
import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import * as http from "http";
import config from "./core/config";
import { Me } from "./models/me";
import session from "express-session";
import userRoutes from "./core/routes/user";
import professorRoutes from "./core/routes/professor";
import MongoStore from "connect-mongo";
import winston from "winston";
import { logger } from "./core/config/utils/logger";


interface MainOptions {
  port: number;
  env: string
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
    if(options.env === "development"){
      winston.addColors(config.logging.colors)
    }else{
      logger.add(new winston.transports.File({filename: config.logging.file, level:config.logging.level}))
    }
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
    //set session
    app.use(sess);
    
    //set routes
    app.use("/user", userRoutes);

    //professor routes
    app.use("/professor", professorRoutes);
    
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
  const ENV = process.env.NODE_ENV ?? "development"
  main({ port: PORT, env: ENV })
    .then(() => {
      logger.log({level: "debug", message: "The server started successfully"})
      console.log(`Server is running at http://localhost:${PORT}`);
    })
    .catch((err) => {
      console.log("Something went wrong");
    });
}
