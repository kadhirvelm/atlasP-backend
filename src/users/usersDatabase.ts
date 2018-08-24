import mongo from "mongodb";

import { IFullUser, IUser, USERS_COLLECTION } from "./userConstants";

import {
  handleError,
  hashPassword,
  sanitizePhoneNumber,
  sanitizeUser,
} from "../utils";

export class UserDatabase {
  constructor(private db: mongo.Db) {}

  /**
   * Public routes
   */

  public createNewUser(user: IUser) {
    return handleError(async () => {
      const finalUser = {
        ...user,
        phoneNumber: sanitizePhoneNumber(user.phoneNumber),
      };
      const newUser = await this.db
        .collection(USERS_COLLECTION)
        .insertOne(finalUser);
      return newUser;
    });
  }

  public async claim(phoneNumber: string) {
    const user = await this.retrieveUserWithPhoneNumber(phoneNumber);
    if (user == null || user.claimed) {
      return {
        error:
          "Phone number is not in the database or user has already been claimed.",
      };
    }
    const updatedUser = {
      ...user,
      claimed: true,
      temporaryPassword: Math.round(1000 + Math.random() * 9999),
    };
    await this.db
      .collection(USERS_COLLECTION)
      .updateOne({ _id: user._id }, updatedUser);
    return { temporaryPassword: updatedUser.temporaryPassword };
  }

  public async login(
    phoneNumber: string,
    password: string,
    temporaryPassword?: number,
  ) {
    const user = await this.retrieveUserWithPhoneNumber(phoneNumber);
    if (
      user == null
      || (temporaryPassword !== undefined && temporaryPassword !== user.temporaryPassword)
      || hashPassword(password) !== user.password
    ) {
      return { error: "Either user doesn't exist, or password is incorrect." };
    }
    return sanitizeUser(user);
  }

  /**
   * Authenticated routes
   */

  public async getUser(id: string) {
    return this.getManyUsers([id]);
  }

  public async getManyUsers(ids: string[]) {
    return handleError(async () => {
      const allUsers = await this.db
        .collection(USERS_COLLECTION)
        .find({ _id: { $in: ids.map((id) => new mongo.ObjectId(id)) } })
        .sort({ name: 1 });
      return allUsers.toArray();
    });
  }

  public async updateUser(userID: mongo.ObjectId, newUserDetails: any) {
    const user = await this.retrieveUserWithID(userID);
    const newDetails = { ...newUserDetails };
    if (newDetails.password !== undefined) {
      newDetails.password = hashPassword(newDetails.password);
      delete user.temporaryPassword;
      delete newDetails.temporaryPassword;
    }
    const updatedUser = { ...user, ...newDetails };
    return handleError(async () => {
      const finalUpdatedUser = await this.db
        .collection(USERS_COLLECTION)
        .replaceOne({ _id: userID }, updatedUser);
      return finalUpdatedUser;
    });
  }

  /**
   * Utils
   */

  private retrieveUserWithPhoneNumber(phoneNumber: string): Promise<IFullUser | null> {
    return this.fetchUser({ phoneNumber: sanitizePhoneNumber(phoneNumber) });
  }

  private retrieveUserWithID(id: mongo.ObjectId): Promise<IFullUser | null> {
    return this.fetchUser({ _id: id });
  }

  private async fetchUser(query: any): Promise<IFullUser | null> {
    const fetchUser = await this.db.collection(USERS_COLLECTION).find(query);
    return fetchUser.next();
  }
}
