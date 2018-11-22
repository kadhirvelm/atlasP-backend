import mongo from "mongodb";

export interface IRelationship {
  _id: mongo.ObjectId;
  frequentUsers?: string[];
  semiFrequentUsers?: string[];
  ignoreUsers?: string[];
}

export const RELATIONSHIPS_COLLECTION = "RELATIONSHIPS";
