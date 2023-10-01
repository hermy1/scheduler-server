//mongo errors
import { DatabaseError } from "./base";

//find error
export class MongoFindError extends DatabaseError {
    constructor (message: string) {
        super(message);
    }
  get statusCode() {
    return 500;
  }
}

//update error
export class MongoUpdateError extends DatabaseError{
    constructor (message: string) {
        super(message);
    }
  get statusCode() {
    return 500;
  }
}

//remove 
export class MongoRemoveError extends DatabaseError{
    constructor (message: string) {
        super(message);
    }
  get statusCode() {
    return 500;
  }
}

//insert error
export class MongoInsertError extends DatabaseError{
    constructor (message: string) {
        super(message);
    }
  get statusCode() {
    return 500;
  }
}