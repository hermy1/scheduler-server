export interface Config {
  mongo: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  server: { secret: string };
}
