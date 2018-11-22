import mongo from "mongodb";

export const PREMIUM_COLLECTION = "PREMIUM";

export interface IPremium {
  _id: mongo.ObjectId;
  expiration: Date;
}
