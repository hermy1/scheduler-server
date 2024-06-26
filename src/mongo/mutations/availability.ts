import { Availability, TimeSlot } from "../../models/availability";
import { ObjectId } from "mongodb";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { MongoInsertError } from "../../core/errors/mongo";

  //insert avilaibility
  export const insertAvailability = async (professorId: ObjectId, weekDay: string, date: Date, timeSlots: { startTime: string, endTime: string } []): Promise <Availability> => {
    return new Promise (async (resolve, reject)=>{
      try {
        let db = await getDB();
        let availabilityCollection = db.collection<Availability>('availability');
        let newAvailability = new Availability();
        newAvailability.professorId = professorId;
        newAvailability.weekDay = weekDay;
        // newAvailability.date = date;
        newAvailability.date = new Date(date); 
        // newAvailability.timeSlots =  Array.isArray(timeSlots) ? timeSlots : JSON.parse(timeSlots);
        newAvailability.timeSlots = Array.isArray(timeSlots) 
        ? timeSlots.map(slot => new TimeSlot(new Date(slot.startTime), new Date(slot.endTime))) 
        : JSON.parse(timeSlots).map((slot: { startTime: string | number | Date; endTime: string | number | Date; }) => new TimeSlot(new Date(slot.startTime), new Date(slot.endTime)));
        let result = await availabilityCollection.insertOne(newAvailability);
        if (result.acknowledged){ 
          resolve(newAvailability);
        } else {
          throw new MongoInsertError("Something went wrong while inserting availability into availability table");
        }
      } catch (err) {
        reject(err);
      }
    })
  };


  //update availability TIME SLOTS AND DATE 
  export const updateAvailability = async (id: ObjectId, date: Date, weekDay: string, addTimeSlots: { startTime: Date, endTime: Date }[], removeTimeSlots: { startTime: Date, endTime: Date }[]): Promise<Availability> => {
    return new Promise(async (resolve, reject) => {
      try {
        let db = await getDB();
        let availabilityCollection = db.collection<Availability>('availability');
        let availability = await availabilityCollection.findOne({ _id: id });
        if (availability) {
          let updateQuery: { $set?: object, $push?: object, $pull?: object } = {
            $set: { date: new Date(date), weekDay: weekDay }
          };
          if (addTimeSlots && addTimeSlots.length > 0) {
            //map time slots to TimeSlot to ensure Date type
            updateQuery['$push'] = { timeSlots: { 
              $each: addTimeSlots.map(slot => new TimeSlot(new Date(slot.startTime), new Date(slot.endTime))) 
            }};
          }
          if (removeTimeSlots && removeTimeSlots.length > 0) {
            updateQuery['$pull'] = { timeSlots: { 
              $or: removeTimeSlots.map(slot => new TimeSlot(new Date(slot.startTime), new Date(slot.endTime)))
            }};
          }
          let result = await availabilityCollection.updateOne({ _id: ensureObjectId(availability._id )}, updateQuery);
          if (result.acknowledged) {
            //fetch updated availability
           let updatedAvailabilty = await availabilityCollection.findOne({ _id: ensureObjectId(availability._id )});
           if(updatedAvailabilty){
            resolve(updatedAvailabilty);
            } else {
                throw new MongoInsertError("Something went wrong while updating availability");
            }
          } else {
            throw new MongoInsertError("Something went wrong while updating availability");
          }
        } else {
          throw new MongoInsertError("Something went wrong while updating availability");
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  //delete availability
  export const deleteAvailability = async (id: ObjectId): Promise<Availability> => {
    return new Promise(async (resolve, reject) => {
      try {
        let db = await getDB();
        let availabilityCollection = db.collection<Availability>('availability');
        let availability = await availabilityCollection.findOne({ _id: id });
        if (availability) {
          let result = await availabilityCollection.deleteOne({ _id: id });
          if (result.acknowledged) {
            resolve(availability);
          } else {
            throw new MongoInsertError("Something went wrong while deleting availability");
          }
        } else {
          throw new MongoInsertError("Something went wrong while deleting availability");
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  export const removeTimeSlot = async (
    professorId: string,
    availabilityId: string,
    { startTime, endTime }: { startTime: Date; endTime: Date }
  ): Promise<boolean> => {
    try {
      const db = await getDB();
      const availabilityCollection = db.collection<Availability>('availability');
      const newStart = new Date(startTime);

      const removeTime = await availabilityCollection.updateOne(
        {
          _id: ensureObjectId(availabilityId),
          professorId: ensureObjectId(professorId),
          'timeSlots.startTime': newStart,
        },
        {
          $pull: {
            timeSlots: { startTime: newStart },
          },
        }
      );

      return removeTime.modifiedCount > 0;
    } catch (error) {
      throw new Error('Error removing time slot: ' + error); 
    }
  };
  
  

