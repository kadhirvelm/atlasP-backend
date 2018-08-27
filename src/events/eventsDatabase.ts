import mongo from "mongodb";

import { EVENTS_COLLECTION, IEvent, IRawEvent } from "./eventsConstants";

import { handleError, parseIntoObjectIDs } from "../utils";

export class EventDatabase {
  constructor(private db: mongo.Db) {}

  public async createNewEvent(event: IRawEvent) {
    return handleError(async () => {
      const newEvent = await this.db
        .collection(EVENTS_COLLECTION)
        .insertOne(this.cleanRawIntoFinal(event));
      return newEvent;
    });
  }

  public async updateEvent(eventId: mongo.ObjectId, event: IRawEvent) {
    return handleError(async () => {
      const newEvent = await this.db
        .collection(EVENTS_COLLECTION)
        .replaceOne({ _id: eventId }, this.cleanRawIntoFinal(event));
      return newEvent;
    });
  }

  public async getOneEvent(eventId: string) {
    return this.getManyEvents([eventId]);
  }

  public async getManyEvents(eventIds: string[]) {
    return handleError(async () => {
      const allEvents = await this.db
        .collection(EVENTS_COLLECTION)
        .find({ _id: { $in: parseIntoObjectIDs(eventIds) } })
        .sort({ date: 1 });
      return allEvents.toArray();
    });
  }

  private cleanRawIntoFinal = (event: IRawEvent): IEvent => ({
    ...event,
    attendees:
        parseIntoObjectIDs(event.attendees),
    date: new Date(event.date),
    host: new mongo.ObjectId(event.host),
  })
}
