import mongo from "mongodb";

export interface IRawEvent {
    attendees: string[];
    date: string;
    description: string;
    host: string;
}

export interface IEvent {
    attendees: mongo.ObjectId[];
    date: Date;
    description: string;
    host: mongo.ObjectId;
}

export const EVENTS_COLLECTION = "EVENTS";
