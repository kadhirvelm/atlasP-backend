import mongo from "mongodb";

export interface IRelationship {
  _id: mongo.ObjectId;
  ignoreUsers?: string[];
}

export const RELATIONSHIPS_COLLECTION = "RELATIONSHIPS";
