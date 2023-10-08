import { ObjectId } from 'mongodb';
import { UserRole } from './user';
export class Me{
    _id: ObjectId = new ObjectId();
    username: string = '';
    role: UserRole = UserRole.Student || UserRole.Professor;
}