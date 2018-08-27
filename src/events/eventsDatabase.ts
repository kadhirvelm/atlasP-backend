import mongo from "mongodb";

import { EVENTS_COLLECTION, IEvent, IRawEvent } from "./eventsConstants";

import { UserDatabase } from "../users";
import { handleError, parseIntoObjectIDs } from "../utils";

export class EventDatabase {
  private userDatabase: UserDatabase;

  constructor(private db: mongo.Db) {
    this.userDatabase = new UserDatabase(db);
  }

  public async createNewEvent(event: IRawEvent) {
    return handleError(async () => {
      const finalEvent = this.cleanRawIntoFinal(event);
      const newEvent = await this.db
        .collection(EVENTS_COLLECTION)
        .insertOne(finalEvent);
      this.userDatabase.indexUserEvents(
        [finalEvent.host, ...finalEvent.attendees],
        newEvent.insertedId,
      );
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
    attendees: parseIntoObjectIDs(event.attendees),
    date: new Date(event.date),
    host: new mongo.ObjectId(event.host),
  })
}
