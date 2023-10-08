import { ObjectId } from "mongodb";

export enum AppointmentStatus {
        Pending = "pending",
        Accepted = "accepted",
        Rejected = "rejected",
        Cancelled = "cancelled"
}

//guest professor
export interface Guest {
    _id: ObjectId;
    name?: string;
    email?: string;
}

export interface Appointment {
    _id: ObjectId;
    student: ObjectId;
    professor: ObjectId;
    date: Date;
    status: AppointmentStatus;
    reason?: string; // message or reason for appointment
    location?: string; // office location
    guest?: Guest; // guest professor 
    secondaryStatus?: Appointment; // guest professor response
    description?: string; // short description/summary of the appointment
    createdAt: Date;
    updatedAt: Date;
}