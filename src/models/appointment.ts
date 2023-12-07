import { ObjectId } from "mongodb";

export enum AppointmentStatus {
        Pending = "pending",
        Accepted = "accepted",
        Rejected = "declined",
        Cancelled = "cancelled",
        Completed = "completed"
}

//guest professor
export class Guest {
    _id: ObjectId = new ObjectId();

}

export class Appointment {
    _id: ObjectId = new ObjectId();
    student: ObjectId = new ObjectId();
    professor: ObjectId = new ObjectId();
    startDateTime: Date = new Date();
    endDateTime: Date = new Date();
    advisor: boolean = false;
    status: AppointmentStatus = AppointmentStatus.Pending;
    reason?: string = ""; // message or reason for appointment
    location?: string = ""; // office location
    guest?: Guest = new Guest(); // guest professor 
    secondaryStatus?: AppointmentStatus | string = ""; // guest professor response
    summary?: string = ""; // short description/summary of the appointment
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    studentCancelled: boolean = false; //true if they decide to cancel the meeting
}

export class FullAppointment{
    _id: ObjectId = new ObjectId();
    student: ObjectId = new ObjectId();
    studentName: string | undefined;
    professor: ObjectId = new ObjectId();
    professorName: string | undefined;
    startDateTime: Date = new Date();
    endDateTime: Date = new Date();
    advisor: boolean = false;
    status: AppointmentStatus = AppointmentStatus.Pending;
    reason?: string = ""; // message or reason for appointment
    location?: string = ""; // office location
    guest?: Guest = new Guest(); // guest professor 
    guestName?: string;
    secondaryStatus?: AppointmentStatus | string = ""; // guest professor response
    summary?: string = ""; // short description/summary of the appointment
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    studentCancelled: boolean = false; //true if they decide to cancel the meeting
}