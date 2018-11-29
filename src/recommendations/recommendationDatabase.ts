import mongo from "mongodb";
import { IUser, UserDatabase } from "../users";
import { fullSanitizeUser, parseIntoObjectIDs } from "../utils";
import {
  getDateKey,
  IUserRecommendations,
  RECOMMENDATIONS_COLLECTION
} from "./recommendationConstants";

export class RecommendationDatabase {
  private users: UserDatabase;

  constructor(private db: mongo.Db) {
    this.users = new UserDatabase(db);
  }

  public async getManyRecommendations(
    ids: string[]
  ): Promise<IUserRecommendations[]> {
    const finalIds = parseIntoObjectIDs(ids);
    const getAllRecommenations = await this.db
      .collection(RECOMMENDATIONS_COLLECTION)
      .find({ _id: { $in: finalIds } });
    return getAllRecommenations.toArray();
  }

  public writeRecommendation(
    userId: mongo.ObjectId,
    currentRecommendations: IUserRecommendations | undefined,
    recommendation: mongo.ObjectId
  ) {
    const dateKey = getDateKey(new Date());
    const newUserRecommendations: IUserRecommendations = {
      _id: userId,
      allRecommendations: {
        ...(currentRecommendations || { allRecommendations: {} })
          .allRecommendations,
        [dateKey]: recommendation
      },
      lastRecommendation: dateKey
    };

    return this.db
      .collection(RECOMMENDATIONS_COLLECTION)
      .replaceOne({ _id: userId }, newUserRecommendations, {
        upsert: true
      });
  }

  public async shouldDisplayUserRecommendationDialog(
    userId: mongo.ObjectId
  ): Promise<IUser | undefined> {
    const userLastSeenRecommendation = await this.db
      .collection(RECOMMENDATIONS_COLLECTION)
      .find({ _id: userId });
    const userLastSeenFinal: IUserRecommendations = await userLastSeenRecommendation.next();
    if (
      userLastSeenFinal === undefined ||
      userLastSeenFinal.lastUserSeenRecommendation ===
        userLastSeenFinal.lastRecommendation
    ) {
      return undefined;
    }

    const user = await this.users.getUser(
      userLastSeenFinal.allRecommendations[
        userLastSeenFinal.lastRecommendation
      ].toHexString()
    );
    return fullSanitizeUser(user[0]);
  }

  public async writeLastUserSeenRecommendation(userId: mongo.ObjectId) {
    const userLastSeen = await this.db
      .collection(RECOMMENDATIONS_COLLECTION)
      .find({ _id: userId });
    const userLastSeenFinal: IUserRecommendations = await userLastSeen.next();
    return this.db.collection(RECOMMENDATIONS_COLLECTION).updateOne(
      { _id: userId },
      {
        $set: {
          lastUserSeenRecommendation: userLastSeenFinal.lastRecommendation
        }
      }
    );
  }
}
