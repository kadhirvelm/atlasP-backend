import mongo from "mongodb";

export interface IRawEvent {
  attendees: string[];
  date: string;
  description: string;
}

export interface IEvent {
  attendees: mongo.ObjectId[];
  date: Date;
  description: string;
}

export interface IFullEvent extends IEvent {
  _id: mongo.ObjectId;
}

export const EVENTS_COLLECTION = "EVENTS";
