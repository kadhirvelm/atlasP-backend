import axios from "axios";
import mongo from "mongodb";

import { isStillPremium } from "../account/accountDatabase";
import { EVENTS_COLLECTION, IFullEvent } from "../events";
import { IRelationship } from "../relationships";
import { IFullUser } from "../users";
import { convertArrayToMap, fullSanitizeUser } from "../utils";
import {
  createSingleEventString,
  getAllAccountUsers,
  getAllClaimedUsers,
  getAllLastEvents,
  getAllRelationships,
  getAllUserEventsMapped,
  getMinimumDaysSince,
  getRawUsers,
  incrementDate
} from "./reportGeneratorUtils";

const INACTIVE_USER_DAY_COUNT = 30;

export interface ICategorizedUser {
  allUsersEventsMapped: IFullEvent[];
  isInactive: boolean;
  isPremium: boolean;
  message: string;
  relationships?: IRelationship;
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

  const allUserIds = allClaimedUsers.map(user => user._id);
  const allPromises = await Promise.all([
    await getAllRelationships(allUserIds, database),
    await getAllAccountUsers(allUserIds, database)
  ]);
  const allRelationships = convertArrayToMap(allPromises[0]);
  const allAccountUsers = convertArrayToMap(allPromises[1]);

  const allCategorizedUsers = allClaimedUsers
    .map(user => {
      const allUsersEventsMapped = getAllUserEventsMapped(
        allLastEventsFetched,
        user
      );
      if (allUsersEventsMapped === undefined) {
        return undefined;
      }

      let isPremium = false;
      const getAccountStatus = allAccountUsers.get(user._id.toHexString());
      if (getAccountStatus !== undefined) {
        isPremium = isStillPremium(getAccountStatus.expiration);
      }

      const daysSinceLastActive = getMinimumDaysSince(allUsersEventsMapped);
      return {
        allUsersEventsMapped,
        isInactive: daysSinceLastActive > INACTIVE_USER_DAY_COUNT,
        isPremium,
        message: `${user.name},${daysSinceLastActive} days,+1${
          user.phoneNumber
        }\n`,
        relationships: allRelationships.get(user._id.toHexString()),
        user
      };
    })
    .filter(user => user !== undefined);

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
