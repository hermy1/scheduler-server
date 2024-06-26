import { ObjectId } from "mongodb";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { Appointment, AppointmentStatus, Guest } from "../../models/appointment";
import { MongoInsertError, MongoUpdateError, MongoFindError } from "../../core/errors/mongo";
import { UserInAdvisor, UserInProfessorCourse } from "../queries/appointment";


export const createAppointment = async (userId:string,professorId:string,startTime:string, endTime:string, advisor:string,reason:string,guestId:string, timeArray:string): Promise<Appointment | string> => {
    return new Promise(async (resolve, reject) => {
        try {
            let shouldContinue = false;
            const isAdvisor = advisor === 'true';
            //if advisor check if student is in advisor's students array
            if (isAdvisor){
                
                let isStudent = await UserInAdvisor(professorId,userId);
                if (isStudent === true){
                    shouldContinue = true;
                    console.log('con',shouldContinue);
                }
            } else {
                //check to see if student is an professor class

                let isStudent = await UserInProfessorCourse(professorId,userId);

                if (isStudent === true){

                    shouldContinue = true;
                }
            }
        

            if(shouldContinue === true){
                const userObjectId = ensureObjectId(userId);
                const professorObjectId = ensureObjectId(professorId);
                const guest = guestId ? ensureObjectId(guestId) : "";
                let newGuest: Guest | undefined;
    
                if (guest instanceof ObjectId) {
                  newGuest = new Guest();
                  newGuest._id = guest;
                } else {
                  newGuest = undefined;
                }
                let db = await getDB();
                const collection = await db.collection<Appointment>('appointments');
    
                let newAppointment = new Appointment();
                newAppointment.student = userObjectId;
                newAppointment.professor = professorObjectId;
                newAppointment.startDateTime = new Date(startTime);
                newAppointment.endDateTime = new Date(endTime);
                newAppointment.advisor = isAdvisor;
                newAppointment.reason = reason;
                newAppointment.guest = newGuest;
                if(newGuest){
                    newAppointment.secondaryStatus = AppointmentStatus.Pending;
                }
                const results = await collection.insertOne(newAppointment);
                if (results.acknowledged) {
                    newAppointment._id = results.insertedId;
                    resolve(newAppointment);
                                } else {
                    reject(new MongoInsertError(`Something went wrong while inserting a new appointment`));
                }
            } else {
                resolve('You are not asscociated with given professor');
            }        

        } catch(err:any){
            reject(err);
        }
    });
}

export const cancelAppointment = async (appointmentId: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Appointment>('appointments');
            let deletedApt = collection.updateOne({'_id':ensureObjectId(appointmentId)}, { $set:{studentCancelled: true}});
  
            if ((await deletedApt).modifiedCount>0) {
                resolve(true)
            } else {
                console.log(deletedApt);
                reject(new MongoInsertError(`Something went wrong while updating your appointment to cancelled`));
            }
        } catch (err: any) {
            reject(err);
        }
    });
};

export const updateAppointmentStatusAndLocationById = async (appointmentId: ObjectId, appointmentStatus: AppointmentStatus): Promise<Appointment> => {
    return new Promise( async (resolve, reject) => {
        try{
            let db = await getDB();
            const appointmentsCollection =  db.collection<Appointment>('appointments')
            const appointmentToBeUpdated = await appointmentsCollection.findOne({ _id: ensureObjectId(appointmentId)});

            if(appointmentToBeUpdated){
                let appointmentStatusUpdate = appointmentsCollection.updateOne({_id: ensureObjectId(appointmentId)}, {$set: {status: appointmentStatus}})

                if((await appointmentStatusUpdate).modifiedCount > 0) {
                    const updatedAppointment = await appointmentsCollection.findOne({ _id: ensureObjectId(appointmentId)});
                    if (updatedAppointment) {
                    resolve(updatedAppointment);
                    } else {
                        reject(new MongoUpdateError("Something went wrong while updating appointment status"))
                    }

                } else {
                    throw new MongoUpdateError("Something went wrong while updating appointment status") 
                }

            } else {
                reject(new MongoFindError("Something went wrong when finding appointment by id"));
            }

        } catch (err) {
            reject(err);
        }
    })
}

export const addSummary = async (appointmentId: string|ObjectId, summary:string, location:string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Appointment>('appointments');
            let addSum = await collection.updateOne({'_id':ensureObjectId(appointmentId)}, { $set:{summary: summary, location: location}}); 
  
            if (addSum.acknowledged) {
                resolve(true)
            } else {
                reject(new MongoInsertError(`Something went wrong while adding summary to the appointment`));
            }
        } catch (err: any) {
            reject(err);
        }
    });
};