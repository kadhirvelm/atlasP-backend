import mongo from "mongodb";

import { EVENTS_COLLECTION, IEvent, IRawEvent } from "./eventsConstants";

import { UserDatabase } from "../users";
import { handleError, parseIntoObjectIDs } from "../utils";

export class EventDatabase {
  private userDatabase: UserDatabase;

  constructor(private db: mongo.Db) {
    this.userDatabase = new UserDatabase(db);
  }

  /** Private routes */

  public async createNewEvent(event: IRawEvent) {
    return handleError(async () => {
      const finalEvent = this.cleanRawIntoFinal(event);
      const newEvent = await this.db
        .collection(EVENTS_COLLECTION)
        .insertOne(finalEvent);
      await this.userDatabase.indexUserEvents(
        [finalEvent.host, ...finalEvent.attendees],
        newEvent.insertedId,
      );
      return newEvent;
    });
  }

  public async updateEvent(eventId: mongo.ObjectId, event: IRawEvent) {
    return handleError(async () => {
      const originalEvent = await this.getOneEvent(eventId.toHexString());
      await this.userDatabase.removeIndexUserEvents(eventId, originalEvent);

      const finalEvent = this.cleanRawIntoFinal(event);
      const newEvent = await this.db
        .collection(EVENTS_COLLECTION)
        .replaceOne({ _id: eventId }, finalEvent);

      await this.userDatabase.indexUserEvents(
        [finalEvent.host, ...finalEvent.attendees],
        eventId,
      );
      return newEvent.result;
    });
  }

  public async getOneEvent(eventId: string) {
    const events = await this.getManyEvents([eventId]);
    return events[0];
  }

  public async getManyEvents(eventIds: string[]): Promise<IEvent[]> {
    return handleError(async () => {
      const allEvents = await this.db
        .collection(EVENTS_COLLECTION)
        .find({ _id: { $in: parseIntoObjectIDs(eventIds) } })
        .sort({ date: 1 });
      return allEvents.toArray();
    });
  }

  public async fetchAll() {
    return this.db.collection(EVENTS_COLLECTION).find().toArray();
  }

  /** Util methods */

  private cleanRawIntoFinal = (event: IRawEvent): IEvent => ({
    ...event,
    attendees: parseIntoObjectIDs(event.attendees),
    date: new Date(event.date),
    host: new mongo.ObjectId(event.host),
  })
}
