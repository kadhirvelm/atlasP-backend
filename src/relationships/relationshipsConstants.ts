import mongo from "mongodb";

export interface IRelationship {
  _id: mongo.ObjectId;
  closeFriendsUsers?: string[];
  familyUsers?: string[];
  ignoreUsers?: string[];
}

export const RELATIONSHIPS_COLLECTION = "RELATIONSHIPS";
