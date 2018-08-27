import mongo from "mongodb";

import { EVENTS_COLLECTION, IEvent, IRawEvent } from "./eventsConstants";

import { handleError, parseIntoObjectIDs } from "../utils";

export class EventDatabase {
    constructor(private db: mongo.Db) {}

    public async createNewEvent(event: IRawEvent) {
        return handleError(async () => {
            const finalEvent = {
                ...event,
                attendees: parseIntoObjectIDs(event.attendees),
                date: new Date(event.date),
                host: new mongo.ObjectId(event.host),
            } as IEvent;
            const newEvent = await this.db
                .collection(EVENTS_COLLECTION)
                .insertOne(finalEvent);
            return newEvent;
        });
    }
}
