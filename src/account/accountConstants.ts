import mongo from "mongodb";

export const ACCOUNT_COLLECTION = "ACCOUNT";

export interface IAccount {
  _id: mongo.ObjectId;
  expiration: Date;
}
