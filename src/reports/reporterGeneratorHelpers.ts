import axios from "axios";
import mongo from "mongodb";

import { EVENTS_COLLECTION, IFullEvent } from "../events";
import { IFullUser } from "../users";
import { fullSanitizeUser } from "../utils";
import {
  createSingleEventString,
  getAllClaimedUsers,
  getAllLastEvents,
  getAllUserEventsMapped,
  getMinimumDaysSince,
  getRawUsers,
  incrementDate,
  REMIND_ON_INACTIVE_DAY_COUNT
} from "./reportGeneratorUtils";

export interface ICategorizedUser {
  allUsersEventsMapped: IFullEvent[];
  isInactive: boolean;
  message: string;
  user: IFullUser;
}

export function getEventsHappeningInTwoDays(database: mongo.Db) {
  return database
    .collection(EVENTS_COLLECTION)
    .find({
      date: {
        $gte: incrementDate(new Date(), 2),
        $lte: incrementDate(new Date(), 3)
      }
    })
    .toArray();
}

export function getEventsHappeningIn24Hours(database: mongo.Db) {
  return database
    .collection(EVENTS_COLLECTION)
    .find({
      _id: {
        $gte: mongo.ObjectId.createFromTime(
          incrementDate(new Date(), -1).getTime() / 1000
        )
      }
    })
    .toArray();
}

export async function getAllUsers(
  database: mongo.Db,
  // tslint:disable-next-line:trailing-comma
  ...events: IFullEvent[][]
) {
  const allUsers: any[] = await getRawUsers(database, ...events);
  return allUsers
    .map(fullSanitizeUser)
    .map(user => ({ [user._id.toHexString()]: user }))
    .reduce((a, b) => ({ ...a, ...b }), []);
}

export async function getCategorizedUsers(
  database: mongo.Db
): Promise<ICategorizedUser[]> {
  const allClaimedUsers = await getAllClaimedUsers(database);
  const allLastEventsFetched = await getAllLastEvents(
    allClaimedUsers,
    database
  );
  const allCategorizedUsers = allClaimedUsers.map(user => {
    const allUsersEventsMapped = getAllUserEventsMapped(
      allLastEventsFetched,
      user
    );
    if (allUsersEventsMapped === undefined) {
      return undefined;
    }

    const daysSinceLastEvent = getMinimumDaysSince(allUsersEventsMapped);
    return {
      allUsersEventsMapped,
      isInactive: daysSinceLastEvent > REMIND_ON_INACTIVE_DAY_COUNT,
      message: `${user.name},${daysSinceLastEvent} days,+1${
        user.phoneNumber
      }\n`,
      user
    };
  });

  return allCategorizedUsers;
}

export function createEventsMailBody(
  eventsMadeInLast24Hours: any[],
  eventsInTwoDays: any[],
  allUsers: any[]
) {
  return `
        <div>
            <b>Events created in the last 24 hours:</b>
            ${eventsMadeInLast24Hours
              .map(event => createSingleEventString(event, allUsers))
              .join("\n")}
            <br />
            <b>Events happening in 2 days:</b>
            ${eventsInTwoDays
              .map(event => createSingleEventString(event, allUsers))
              .join("\n")}
        </div>
    `;
}

export function createPeopleMailBody(
  allRecommendations: any[],
  allInactiveUsers: any[]
) {
  return `
        <div>
            <b>Recommendations:</b>
            <div>
                ${allRecommendations.join("<br />")}
            </div>
            <br />
            <b>Inactive users:</b>
            <div>
                ${allInactiveUsers.join("<br />")}
            </div>
        </div>
    `;
}

export function createMailSubject() {
  return `AtlasP Text Report - ${new Date().toLocaleDateString()} (${
    process.env.NODE_ENV
  })`;
}

export async function getDadJoke() {
  const dadJoke = await axios.get("https://icanhazdadjoke.com/", {
    headers: { Accept: "application/json" }
  });
  return dadJoke.data.joke;
}
