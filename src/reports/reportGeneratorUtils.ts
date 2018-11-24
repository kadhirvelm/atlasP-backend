import mongo from "mongodb";
import { ACCOUNT_COLLECTION, IAccount } from "../account";
import { EVENTS_COLLECTION, IFullEvent } from "../events";
import { IRelationship, RELATIONSHIPS_COLLECTION } from "../relationships";
import { IFullUser, USERS_COLLECTION } from "../users";
import { flatten } from "../utils";

export const REMIND_ON_INACTIVE_DAY_COUNT = 30;

export const convertToMongoId = (id: string) => new mongo.ObjectId(id);

export const extractUsers = (event: any) =>
  event.attendees.map(convertToMongoId);

export const renderSingleAttendee = (userID: string, allUsers: any) =>
  allUsers[userID].name;

export function getRawUsers(database: mongo.Db, ...events: IFullEvent[][]) {
  return database
    .collection(USERS_COLLECTION)
    .find({
      _id: {
        $in: events
          .reduce(flatten, [])
          .map(extractUsers)
          .reduce(flatten, [])
      }
    })
    .toArray();
}

export function incrementDate(date: Date, days: number) {
  date.setDate(date.getDate() + days);
  return date;
}

export function differenceBetweenMongoIdDates(idA: string, idB: string) {
  return (
    new mongo.ObjectId(idA).getTimestamp().getTime() -
    new mongo.ObjectId(idB).getTimestamp().getTime()
  );
}

export function differenceBetweenDates(dateA: Date, dateB: Date) {
  const SINGLE_DAY = 1000 * 60 * 60 * 24;
  return Math.round((dateA.getTime() - dateB.getTime()) / SINGLE_DAY);
}

export function createSingleEventString(event: any, allUsers: any) {
  return `
        <div>
            ${event.description},${new Date(
    event.date
  ).toLocaleDateString()}, ${event._id},
            ${event.attendees
              .map((user: any) => renderSingleAttendee(user, allUsers))
              .join(",")}
        </div>
    `;
}

export function getLatestEvent(events: IFullEvent[]) {
  return events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-1)[0];
}

export function getLatestEventOnCreation(events: IFullEvent[]) {
  return events
    .sort(
      (a, b) => a._id.getTimestamp().getTime() - b._id.getTimestamp().getTime()
    )
    .slice(-1)[0];
}

export async function getAllClaimedUsers(
  database: mongo.Db
): Promise<IFullUser[]> {
  return database
    .collection(USERS_COLLECTION)
    .find({ claimed: true })
    .toArray();
}

export async function getAllLastEvents(
  allClaimedUsers: any[],
  database: mongo.Db
): Promise<IFullEvent[]> {
  const allLastEventsOfClaimedUsers = allClaimedUsers
    .map(user => user.connections[user._id])
    .reduce(flatten);
  return database
    .collection(EVENTS_COLLECTION)
    .find({ _id: { $in: allLastEventsOfClaimedUsers.map(convertToMongoId) } })
    .toArray();
}

export function getAllUserEventsMapped(
  allLastEventsFetched: IFullEvent[],
  user: IFullUser
): IFullEvent[] | undefined {
  const allUserEvents = user.connections[user._id.toHexString()];
  if (allUserEvents === undefined || allUserEvents.length === 0) {
    return undefined;
  }

  return allUserEvents.map(eventId =>
    allLastEventsFetched.find(
      event => event._id.toString() === eventId.toString()
    )
  );
}

export function getMinimumDaysSince(allUsersEventsMapped: IFullEvent[]) {
  const daysSinceLastEventCreation = differenceBetweenDates(
    new Date(),
    new mongo.ObjectId(
      getLatestEventOnCreation(allUsersEventsMapped)._id
    ).getTimestamp()
  );
  const daysSinceLastEvent = differenceBetweenDates(
    new Date(),
    getLatestEvent(allUsersEventsMapped).date
  );
  return Math.min(daysSinceLastEventCreation, daysSinceLastEvent);
}

export function getAllUsersWithIds(ids: mongo.ObjectId[], database: mongo.Db) {
  return database
    .collection(USERS_COLLECTION)
    .find({ _id: { $in: ids } })
    .toArray();
}

export function getAllRelationships(
  ids: mongo.ObjectID[],
  database: mongo.Db
): Promise<IRelationship[]> {
  return database
    .collection(RELATIONSHIPS_COLLECTION)
    .find({ _id: { $in: ids } })
    .toArray();
}

export function getAllAccountUsers(
  ids: mongo.ObjectId[],
  database: mongo.Db
): Promise<IAccount[]> {
  return database
    .collection(ACCOUNT_COLLECTION)
    .find({ _id: { $in: ids } })
    .toArray();
}
