import { IUser } from "../users";

export interface IEvent {
    date: Date;
    description: string;
    attendees: IUser[];
}

export const EVENTS_COLLECTION = "EVENTS";
