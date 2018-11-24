import mongo from "mongodb";
import { parseIntoObjectIDs } from "../utils";
import {
  getDateKey,
  IUserRecommendations,
  RECOMMENDATIONS_COLLECTION
} from "./recommendationConstants";

export class RecommendationsDatabase {
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
    const newUserRecommendations: IUserRecommendations = {
      _id: userId,
      allRecommendations: {
        ...(currentRecommendations || { allRecommendations: {} })
          .allRecommendations,
        [getDateKey(new Date())]: recommendation
      },
      lastRecommendation: new Date()
    };

    return this.db
      .collection(RECOMMENDATIONS_COLLECTION)
      .replaceOne({ _id: userId }, newUserRecommendations, {
        upsert: true
      });
  }
}
