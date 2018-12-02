import mongo from "mongodb";

import { IFullEvent } from "../events";
import { IRelationship } from "../relationships";
import { ICategorizedUser } from "../reports/reporterGeneratorHelpers";
import {
  convertToMongoId,
  differenceBetweenDates,
  differenceBetweenMongoIdDates,
  getAllUsersWithIds,
  getLatestEvent
} from "../reports/reportGeneratorUtils";
import { IFullUser } from "../users";
import { convertArrayToMap, isNumber, isString } from "../utils";
import { IUserRecommendations } from "./recommendationConstants";
import { RecommendationDatabase } from "./recommendationDatabase";

const TOTAL_CONNECTIONS_MODIFIER = 1.05;
const LATEST_EVENT_MODIFIER = 1.2;
const NEVER_BEFORE_SEEN_FRIEND = "NEW FRIEND";

const TOTAL_DAYS_UNTIL_NEXT_RECOMMENDATION = 7;
const DEFAULT_FREQUENCY_DAY_COUNT = 30;

interface IFilteredRecommendationScores extends IRecommendationScore {
  score: number;
}

interface IRecommendationScore {
  id: string;
  score: number | string;
}

export interface IRecommendation {
  activeUser: IFullUser;
  recommendation: string;
  score: number | string;
}

/**
 * Returns the frequency at which a user wants to see another user, defaulting to
 * DEFAULT_FREQUENCY_DAY_COUNT and returning Infinity if the user is on the ignore list.
 */
function getFrequency(
  userId: string,
  relationships: IRelationship,
  isPremium: boolean
) {
  if (!isPremium) {
    return DEFAULT_FREQUENCY_DAY_COUNT;
  }

  const remindOnDate =
    relationships.frequency[userId] || DEFAULT_FREQUENCY_DAY_COUNT;
  return remindOnDate === "IGNORE" ? Infinity : remindOnDate;
}

/**
 * The score is based on:
 * totalConnections^(TOTAL_CONNECTIONS_MODIFIER) * totalDaysSinceLastEvent^(LATEST_EVENT_MODIFIER),
 * but spits out NEVER_BEFORE_SEEN_FRIEND if they haven't seen this person yet.
 */
function generateRecommendationScores(
  activeUser: IFullUser,
  allUsersEventsMap: Map<string, IFullEvent>,
  relationships: IRelationship,
  isPremium: boolean
): IRecommendationScore[] {
  if (activeUser.connections === undefined) {
    return [];
  }

  const connectionsCopy = { ...activeUser.connections };
  delete connectionsCopy[activeUser._id.toHexString()];

  return Object.entries(connectionsCopy).map(userConnection => {
    if (userConnection[1].length === 0) {
      return {
        id: userConnection[0],
        score: NEVER_BEFORE_SEEN_FRIEND
      };
    }

    const totalConnectionsScore =
      userConnection[1].length ** TOTAL_CONNECTIONS_MODIFIER;

    const latestEvent = getLatestEvent(
      userConnection[1].map(id => allUsersEventsMap.get(id.toHexString()))
    );
    const totalDaysSinceLastEvent =
      differenceBetweenDates(new Date(), latestEvent.date) -
      getFrequency(userConnection[0], relationships, isPremium);
    const latestEventScore = totalDaysSinceLastEvent ** LATEST_EVENT_MODIFIER;

    return {
      id: userConnection[0],
      score: totalConnectionsScore * latestEventScore
    };
  });
}

/**
 * Generates a recommendation for the active user to see next. It first removes
 * all users the activeUser has seen with their frequency || DEFAULT_FREQUENCY_DAY_COUNT.
 * Then it checks to see if there are any people who the user has not seen yet.
 * If any are present, they are returned as the recommendation.
 *
 * If no new people exist, it then scores all users and selects the one with the
 * highest score, being sure to select someone new if they've seen this person last week.
 */
function getRecommendation(
  activeUser: IFullUser,
  allUsersEventsMapped: IFullEvent[],
  relationships: IRelationship,
  isPremium: boolean,
  previousRecommendations: IUserRecommendations | undefined
): IRecommendation {
  const recommendationScores = generateRecommendationScores(
    activeUser,
    convertArrayToMap(allUsersEventsMapped),
    relationships,
    isPremium
  );

  const getNewPeople = recommendationScores.filter(recommendationScore =>
    isString(recommendationScore.score)
  );

  if (getNewPeople.length > 0) {
    const sortedByCreationDateNewPeople = getNewPeople.sort((a, b) =>
      differenceBetweenMongoIdDates(a.id, b.id)
    );
    return {
      activeUser,
      recommendation: sortedByCreationDateNewPeople[0].id,
      score: "New Friend"
    };
  }

  const filterOutPeopleSeenLessThanCutOff = recommendationScores.filter(
    recommendationScore =>
      isNumber(recommendationScore.score) && recommendationScore.score > 0
  ) as IFilteredRecommendationScores[];
  if (filterOutPeopleSeenLessThanCutOff.length === 0) {
    return {
      activeUser,
      recommendation: activeUser._id.toHexString(),
      score: "Add a new friend"
    };
  }

  const sortedRecommendations = filterOutPeopleSeenLessThanCutOff.sort(
    (a, b) => b.score - a.score
  );

  let generatedRecommendation = sortedRecommendations[0];
  if (
    previousRecommendations !== undefined &&
    previousRecommendations.allRecommendations[
      previousRecommendations.lastRecommendation
    ].toHexString() === generatedRecommendation.id
  ) {
    generatedRecommendation = sortedRecommendations[1];
  }

  return {
    activeUser,
    recommendation: generatedRecommendation.id,
    score: generatedRecommendation.score
  };
}

function getAllRecommendedFriends(
  allRecommendations: IRecommendation[],
  database: mongo.Db
) {
  const getAllRecommendedUsersIds = allRecommendations
    .map(recommendation => recommendation.recommendation)
    .map(convertToMongoId);
  return getAllUsersWithIds(getAllRecommendedUsersIds, database);
}

function assembleRecommendationString(
  activeUser: IFullUser,
  recommendedFriend: IFullUser,
  score: number | string
) {
  return `${activeUser.name},${activeUser.phoneNumber},should see,${
    recommendedFriend.name
  },${recommendedFriend.phoneNumber || "NO NUMBER"},${score}\n`;
}

async function getAllPreviousRecommendations(
  ids: string[],
  recommendationDatabase: RecommendationDatabase
): Promise<Map<string, IUserRecommendations>> {
  const allPreviousRecommendations = await recommendationDatabase.getManyRecommendations(
    ids
  );
  return convertArrayToMap(allPreviousRecommendations);
}

async function writeRecommendationsToDatabase(
  allRecommendations: IRecommendation[],
  allPreviousRecommendations: Map<string, IUserRecommendations>,
  recommendationDatabase: RecommendationDatabase
) {
  for (const recommendation of allRecommendations) {
    await recommendationDatabase.writeRecommendation(
      recommendation.activeUser._id,
      allPreviousRecommendations.get(
        recommendation.activeUser._id.toHexString()
      ),
      new mongo.ObjectId(recommendation.recommendation)
    );
  }
}

function filterByAtLeastOneWeekSinceRecommendation(
  allActiveUsers: ICategorizedUser[],
  allPreviousRecommendations: Map<string, IUserRecommendations>
): ICategorizedUser[] {
  return allActiveUsers.filter(user => {
    const previousRecommendation = allPreviousRecommendations.get(
      user.user._id.toHexString()
    );
    if (previousRecommendation === undefined) {
      return true;
    }
    return (
      differenceBetweenDates(
        new Date(),
        new Date(previousRecommendation.lastRecommendation)
      ) > TOTAL_DAYS_UNTIL_NEXT_RECOMMENDATION
    );
  });
}

export async function getAllRecommendations(
  allActiveUsers: ICategorizedUser[],
  database: mongo.Db
) {
  const recommendationDatabase = new RecommendationDatabase(database);

  const allPreviousRecommendations = await getAllPreviousRecommendations(
    allActiveUsers.map(user => user.user._id.toHexString()),
    recommendationDatabase
  );
  const allFilteredRecommendations = filterByAtLeastOneWeekSinceRecommendation(
    allActiveUsers,
    allPreviousRecommendations
  );

  const allRecommendations = allFilteredRecommendations.map(user =>
    getRecommendation(
      user.user,
      user.allUsersEventsMapped,
      user.relationships,
      user.isPremium,
      allPreviousRecommendations.get(user.user._id.toHexString())
    )
  );

  writeRecommendationsToDatabase(
    allRecommendations,
    allPreviousRecommendations,
    recommendationDatabase
  );

  const allRecommendedUsers = await getAllRecommendedFriends(
    allRecommendations,
    database
  );
  return allRecommendations.map(recommendation =>
    assembleRecommendationString(
      recommendation.activeUser,
      allRecommendedUsers.find(
        user =>
          user._id.toHexString() === recommendation.recommendation.toString()
      ),
      recommendation.score
    )
  );
}
