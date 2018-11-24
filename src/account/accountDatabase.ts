import mongo from "mongodb";
import { ACCOUNT_COLLECTION } from "./accountConstants";

export class AccountDatabase {
  constructor(private db: mongo.Db) {}

  public async checkAccountStatus(userId: mongo.ObjectId) {
    const userAccountStatus = await this.db
      .collection(ACCOUNT_COLLECTION)
      .find({ _id: userId });
    const status = await userAccountStatus.next();
    if (status === null) {
      return { isPremium: false };
    }
    return {
      expiration: status.expiration,
      isPremium: isStillAccount(status.expiration)
    };
  }

  public async upgradeUser(userId: mongo.ObjectId, expiration: Date) {
    await this.db
      .collection(ACCOUNT_COLLECTION)
      .replaceOne(
        { _id: userId },
        { expiration, _id: userId },
        { upsert: true }
      );
    return { expiration, isPremium: isStillAccount(expiration) };
  }
}

/**
 * Utils
 */

function isStillAccount(date: string | Date) {
  if (isString(date)) {
    return new Date(date).getTime() - new Date().getTime() > 0;
  }
  return date.getTime() - new Date().getTime() > 0;
}

function isString(date: string | Date): date is string {
  return typeof date === "string";
}
