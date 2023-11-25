import { Availability, TimeSlot } from "../../models/availability";
import { ObjectId } from "mongodb";
import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { MongoInsertError } from "../../core/errors/mongo";

  //insert avilaibility
  export const insertAvailability = async (professorId: ObjectId, weekDay: string, date: Date, timeSlots: []): Promise <Availability> => {
    return new Promise (async (resolve, reject)=>{
      try {
        let db = await getDB();
        let availabilityCollection = db.collection<Availability>('availability');
        let newAvailability = new Availability();
        newAvailability.professorId = professorId;
        newAvailability.weekDay = weekDay;
        newAvailability.date = date;
        newAvailability.timeSlots =  Array.isArray(timeSlots) ? timeSlots : JSON.parse(timeSlots);
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
            $set: { date: date, weekDay: weekDay }
          };
          if (addTimeSlots && addTimeSlots.length > 0) {
            updateQuery['$push'] = { timeSlots: { $each: addTimeSlots } };
          }
          if (removeTimeSlots && removeTimeSlots.length > 0) {
            updateQuery['$pull'] = { timeSlots: { $or: removeTimeSlots } };
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
      const result = await availabilityCollection.findOne({
        _id: ensureObjectId(availabilityId),
        professorId: ensureObjectId(professorId),
      });
  
      let newStart = new Date(startTime);
  
      if (result) {
        for (let i = 0; i < result.timeSlots.length; i++) {
          if ("" + result.timeSlots[i].startTime + "" === newStart.toString()) {
            let removeTime = await availabilityCollection.updateOne(
              {
                _id: ensureObjectId(availabilityId),
                'timeSlots.startTime': newStart,
              },
              {
                $pull: {
                  timeSlots: { startTime: newStart },
                },
              }
            );
  
            if (removeTime.modifiedCount > 0) {
              return true;
            } else {
              // If the loop finishes without returning true, there was no match
              return false;
            }
          }
        }
  
        // If the loop finishes without returning, there was no match
        return false;
      } else {
        // Handle the case where the result is null
        return false;
      }
    } catch (error) {
      console.error('Error removing time slot:', error);
      return false;
    }
  };
  
  
  
  

