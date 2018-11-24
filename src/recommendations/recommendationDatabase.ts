import mongo from "mongodb";
import { parseIntoObjectIDs } from "../utils";
import {
  getDateKey,
  IUserRecommendations,
  RECOMMENDATIONS_COLLECTION
} from "./recommendationConstants";

export class RecommendationDatabase {
  constructor(private db: mongo.Db) {}

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

  public async shouldDisplayRecommendationDialog(
    userId: mongo.ObjectId
  ): Promise<boolean> {
    const userLastSeenRecommendation = await this.db
      .collection(RECOMMENDATIONS_COLLECTION)
      .find({ _id: userId });
    const userLastSeenFinal: IUserRecommendations = await userLastSeenRecommendation.next();
    return userLastSeenFinal === undefined
      ? false
      : userLastSeenFinal.lastUserSeenRecommendation !==
          userLastSeenFinal.lastRecommendation;
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
