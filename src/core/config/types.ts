export interface Config {
  mongo: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  server: { secret: string,
    mongoConnect: string
   };
   mail: {
    sender: string,
    host: string,
    port: number,
    user: string,
    pass: string,
    subject_text:string,
}
 corsOrigin: string;
}
