import mongo from "mongodb";
import { PREMIUM_COLLECTION } from "./premiumConstants";

export class PremiumDatabase {
  constructor(private db: mongo.Db) {}

  public async checkPremiumStatus(userId: mongo.ObjectId) {
    const userPremiumStatus = await this.db
      .collection(PREMIUM_COLLECTION)
      .find({ _id: userId });
    const status = await userPremiumStatus.next();
    if (status === null) {
      return { isPremium: false };
    }
    return {
      expiration: status.expiration,
      isPremium: isStillPremium(status.expiration)
    };
  }

  public async upgradeUser(userId: mongo.ObjectId, expiration: Date) {
    await this.db
      .collection(PREMIUM_COLLECTION)
      .replaceOne(
        { _id: userId },
        { expiration, _id: userId },
        { upsert: true }
      );
    return { expiration, isPremium: isStillPremium(expiration) };
  }
}

/**
 * Utils
 */

function isStillPremium(date: string | Date) {
  if (isString(date)) {
    return new Date(date).getTime() - new Date().getTime() > 0;
  }
  return date.getTime() - new Date().getTime() > 0;
}

function isString(date: string | Date): date is string {
  return typeof date === "string";
}
