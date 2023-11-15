import { ObjectId } from "mongodb";

export class TimeSlot {
    startTIme: Date = new Date();
    endTime: Date = new Date();
}
export class Availability {
    _id: ObjectId = new ObjectId();
    professorId: ObjectId = new ObjectId();
    weekDay: string = ""; // Monday, Tuesday, Wednesday, Thursday, Friday
    date: Date = new Date();
    timeSlots: TimeSlot[] = [];
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
}


//add new slot expected json body example
/**
 * To a new slot, you need to provide the following:
{
    "availabilityId": "654af06db2b961cd0027188a",
    "newTimeSlots": [
      { "startTime": "2024-12-12T09:00:00.000Z", "endTime": "2024-12-12T09:00:00.000Z" },
      { "startTime": "2024-12-12T09:00:00.000Z", "endTime": "2024-12-12T09:00:00.000Z" }
    ],
    "date": "2022-01-01",
    "weekDay": "Monday"
  }
  
  //upate object to remove slots example
  *To remove a slot, you need to provide the following:
  {
    "availabilityId": "654af06db2b961cd0027188a",
    "removeTimeSlots": [
      { "startTime": "2024-12-12T09:00:00.000Z0", "endTime": "2024-12-12T09:00:00.000Z" }
    ],
    "date": "2022-01-01",
    "weekDay": "Monday"
  }
  **/