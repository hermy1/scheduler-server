export interface Config {
  mongo: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  logging: {
    levels: {},
    colors: {},
    silent: boolean,
    level: string,
    file: string
  };
  server: { secret: string,
    mongoConnect: string
   };
}
