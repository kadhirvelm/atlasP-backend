import mongo from "mongodb";
import { IFullEvent } from "../events";
import { IRelationship } from "../relationships";
import { IFullUser } from "../users";
import { convertArrayToMap } from "../utils";
import { ICategorizedUser } from "./reporterGeneratorHelpers";
import {
  convertToMongoId,
  differenceBetweenDates,
  differenceBetweenMongoIdDates,
  getAllUsersWithIds,
  getLatestEvent,
  REMIND_ON_INACTIVE_DAY_COUNT
} from "./reportGeneratorUtils";

const TOTAL_CONNECTIONS_MODIFIER = 1.0;
const LATEST_EVENT_MODIFIER = 1.2;
const NEVER_BEFORE_SEEN_FRIEND = -1;
const FREQUENT_MODIFIER = 16;
const SEMI_FREQUENT_MODIFIER = 8;

export interface IRecommendation {
  activeUser: IFullUser;
  recommendation: string;
  score: number | string;
}

/**
 * Sets an ignore user's score to 0 if they're on the ignore list, multiplies it
 * by FREQUENT_MODIFIER if a user has been categorized into frequent and by
 * SEMI_FREQUENT_MODIFIER if a user has been categorized into semi-frequent.
 */
function getRelationshipModifier(userId: string, relationships: IRelationship) {
  const checkRelationship = (
    trueModifier: number,
    falseModifier: number,
    relationship: string[] | undefined
  ) => {
    if (relationship === undefined) {
      return 1;
    }
    return relationship.includes(userId) ? trueModifier : falseModifier;
  };
  return (
    checkRelationship(0, 1, relationships.ignoreUsers) *
    checkRelationship(FREQUENT_MODIFIER, 1, relationships.frequentUsers) *
    checkRelationship(
      SEMI_FREQUENT_MODIFIER,
      1,
      relationships.semiFrequentUsers
    )
  );
}

/**
 * The score is based on:
 * totalConnections^(TOTAL_CONNECTIONS_MODIFIER) * totalDaysSinceLastEvent^(LATEST_EVENT_MODIFIER),
 * making sure to set NaN scores for all people who the activeUser has seen less
 * than REMIND_ON_INACTIVE_DAY_COUNT.
 */
function generateRecommendationScores(
  activeUser: IFullUser,
  allUsersEventsMap: Map<string, IFullEvent>,
  relationships: IRelationship,
  isPremium: boolean
): Array<[string, number]> {
  if (activeUser.connections === undefined) {
    return [];
  }

  const connectionsCopy = { ...activeUser.connections };
  delete connectionsCopy[activeUser._id.toHexString()];

  return Object.entries(connectionsCopy).map(userConnection => {
    const totalConnectionsScore =
      userConnection[1].length ** TOTAL_CONNECTIONS_MODIFIER;

    const latestEvent = getLatestEvent(
      userConnection[1].map(id => allUsersEventsMap.get(id.toHexString()))
    );

    let totalDaysSinceLastEvent = 0;
    if (latestEvent !== undefined) {
      totalDaysSinceLastEvent =
        differenceBetweenDates(new Date(), latestEvent.date) -
        REMIND_ON_INACTIVE_DAY_COUNT;
    }
    const latestEventScore = totalDaysSinceLastEvent ** LATEST_EVENT_MODIFIER;

    const relationshipModifier = isPremium
      ? getRelationshipModifier(userConnection[0], relationships)
      : 1;

    const checkForNewFriends =
      userConnection[1].length > 0
        ? totalConnectionsScore * latestEventScore
        : NEVER_BEFORE_SEEN_FRIEND;

    const finalScore = checkForNewFriends * relationshipModifier;

    return [userConnection[0], finalScore] as [string, number];
  });
}

/**
 * Generates a recommendation for the active user to see next. It first removes
 * all users seen in the last 30 days. Then it checks to see if there are any people
 * who the user has not seen yet. If any are present, they are returned as the
 * recommendation.
 *
 * If no new people exist, it then scores all users and selects the one with the
 * highest score.
 */
function getRecommendation(
  activeUser: IFullUser,
  allUsersEventsMapped: IFullEvent[],
  relationships: IRelationship,
  isPremium: boolean
): IRecommendation {
  const recommendationScores = generateRecommendationScores(
    activeUser,
    convertArrayToMap(allUsersEventsMapped),
    relationships,
    isPremium
  );

  const getNewPeople = recommendationScores.filter(
    score => score[1] === NEVER_BEFORE_SEEN_FRIEND
  );
  if (getNewPeople.length > 0) {
    const sortedByCreationDateNewPeople = getNewPeople.sort((a, b) =>
      differenceBetweenMongoIdDates(a[0], b[0])
    );
    return {
      activeUser,
      recommendation: sortedByCreationDateNewPeople[0][0],
      score: "New Friend"
    };
  }

  const filterOutPeopleSeenLessThanCutOff = recommendationScores.filter(
    score => !isNaN(score[1]) && score[1] > 0
  );
  if (filterOutPeopleSeenLessThanCutOff.length === 0) {
    return {
      activeUser,
      recommendation: activeUser._id.toHexString(),
      score: "Add a new friend"
    };
  }

  const sortedRecommendations = filterOutPeopleSeenLessThanCutOff.sort(
    (a, b) => b[1] - a[1]
  );
  return {
    activeUser,
    recommendation: sortedRecommendations[0][0],
    score: sortedRecommendations[0][1]
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

export async function getAllRecommendations(
  allActiveUsers: ICategorizedUser[],
  database: mongo.Db
) {
  const allRecommendations = allActiveUsers.map(user =>
    getRecommendation(
      user.user,
      user.allUsersEventsMapped,
      user.relationships,
      user.isPremium
    )
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
