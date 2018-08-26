import mongo from "mongodb";

import { EVENTS_COLLECTION, IEvent } from "./eventsConstants";

import { handleError } from "../utils";

export class EventDatabase {
    constructor(private db: mongo.Db) {}

    public async createNewEvent(event: IEvent) {
        return handleError(async () => {
            const newEvent = await this.db
                .collection(EVENTS_COLLECTION)
                .insertOne(event);
            return newEvent;
        });
    }
}
