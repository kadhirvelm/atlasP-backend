import mongo from "mongodb";

export const RECOMMENDATIONS_COLLECTION = "RECOMMENDATIONS";

export interface IRecommendations {
  [date: string]: mongo.ObjectId;
}

export interface IUserRecommendations {
  _id: mongo.ObjectId;
  lastRecommendation: Date;
  allRecommendations: IRecommendations;
}

export const getDateKey = (date: Date) => date.toLocaleDateString();
