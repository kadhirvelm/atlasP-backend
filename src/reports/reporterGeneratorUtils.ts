import mongo from "mongodb";
import { EVENTS_COLLECTION, IEvent } from "../events";
import { USERS_COLLECTION } from "../users";
import { flatten, fullSanitizeUser } from "../utils";

const REMIND_ON_INACTIVE_DAY_COUNT = 30;

const convertToMongoId = (id: string) => new mongo.ObjectId(id);

const extractUsers = (event: any) => event.attendees.map(convertToMongoId);

function getRawUsers(database: mongo.Db, ...events: IEvent[][]) {
  return database
    .collection(USERS_COLLECTION)
    .find({
      _id: {
        $in: events
          .reduce(flatten, [])
          .map(extractUsers)
          .reduce(flatten, []),
      },
    })
    .toArray();
}

function incrementDate(date: Date, days: number) {
  date.setDate(date.getDate() + days);
  return date;
}

function differenceBetweenDates(dateA: Date, dateB: Date) {
  const SINGLE_DAY = 1000 * 60 * 60 * 24;
  return Math.round((dateA.getTime() - dateB.getTime()) / SINGLE_DAY);
}

const renderSingleAttendee = (userID: string, allUsers: any) => `${allUsers[userID].name}, +1${allUsers[userID].phoneNumber}`;

function createSingleEventString(event: any, allUsers: any) {
  return `
        <div>
            ${event.description},${new Date(
  event.date,
).toLocaleDateString()}, ${event._id},
            ${event.attendees
    .map((user: any) => renderSingleAttendee(user, allUsers))
    .join(",")}
        </div>
    `;
}

export function getEventsHappeningInTwoDays(database: mongo.Db) {
  return database
    .collection(EVENTS_COLLECTION)
    .find({
      date: {
        $gte: incrementDate(new Date(), 2),
        $lte: incrementDate(new Date(), 3),
      },
    })
    .toArray();
}

export function getEventsHappeningIn24Hours(database: mongo.Db) {
  return database
    .collection(EVENTS_COLLECTION)
    .find({
      _id: {
        $gte: mongo.ObjectId.createFromTime(
          incrementDate(new Date(), -1).getTime() / 1000,
        ),
      },
    })
    .toArray();
}

export async function getAllUsers(database: mongo.Db, ...events: IEvent[][]) {
  const allUsers: any[] = await getRawUsers(database, ...events);
  return allUsers
    .map(fullSanitizeUser)
    .map((user) => ({ [user._id.toHexString()]: user }))
    .reduce((a, b) => ({ ...a, ...b }), []);
}

export function getLatestEvent(events: any[]) {
  return events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-1)[0];
}

export function getLatestEventOnCreation(events: any[]) {
  return events
    .sort((a, b) => a._id.getTimestamp() - b._id.getTimestamp())
    .slice(-1)[0];
}

export async function getAllInactiveUsers(database: mongo.Db) {
  const allClaimedUsers = await database
    .collection(USERS_COLLECTION)
    .find({ claimed: true })
    .toArray();
  const allLastEventsOfClaimedUsers = allClaimedUsers
    .map((user) => user.connections[user._id])
    .reduce(flatten);

  const allLastEventsFetched = await database
    .collection(EVENTS_COLLECTION)
    .find({ _id: { $in: allLastEventsOfClaimedUsers.map(convertToMongoId) } })
    .toArray();
  const allInactiveUsers = allClaimedUsers
    .map((user) => {
      const allUserEvents = user.connections[user._id];
      if (allUserEvents === undefined || allUserEvents.length === 0) {
        return undefined;
      }

      const allUsersEventsMapped = allUserEvents.map((eventId: string) => allLastEventsFetched.find(
        (event) => event._id.toString() === eventId.toString(),
      ));

      const daysSinceLastEventCreation = differenceBetweenDates(
        new Date(),
        new mongo.ObjectId(
          getLatestEventOnCreation(allUsersEventsMapped)._id,
        ).getTimestamp(),
      );
      const daysSinceLastEvent = differenceBetweenDates(
        new Date(),
        getLatestEvent(allUsersEventsMapped).date,
      );

      if (
        daysSinceLastEvent > REMIND_ON_INACTIVE_DAY_COUNT
        && daysSinceLastEventCreation > REMIND_ON_INACTIVE_DAY_COUNT
      ) {
        return `${user.name},${Math.min(
          daysSinceLastEvent,
          daysSinceLastEventCreation,
        )} days,+1${user.phoneNumber}`;
      }

      return undefined;
    })
    .filter((value) => value !== undefined);

  return allInactiveUsers;
}

export function createEventsMailBody(
  eventsMadeInLast24Hours: any[],
  eventsInTwoDays: any[],
  allUsers: any[],
) {
  return `
        <div>
            <b>Events created in the last 24 hours:</b>
            ${eventsMadeInLast24Hours
    .map((event) => createSingleEventString(event, allUsers))
    .join("\n")}
            <br />
            <b>Events happening in 2 days:</b>
            ${eventsInTwoDays
    .map((event) => createSingleEventString(event, allUsers))
    .join("\n")}
        </div>
    `;
}

export function createPeopleMailBody(allInactiveUsers: any[]) {
  return `
        <div>
            <b>Inactive users:</b>
            <div>
                ${allInactiveUsers.join("\n")}
            </div>
        </div>
    `;
}

export function createMailSubject() {
  return `AtlasP Text Report - ${new Date().toLocaleDateString()} (${
    process.env.NODE_ENV
  })`;
}
