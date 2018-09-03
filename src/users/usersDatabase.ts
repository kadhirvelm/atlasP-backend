import mongo from "mongodb";

import { IFullUser, IUser, USERS_COLLECTION } from "./userConstants";

import { IEvent } from "../events";
import {
  handleError,
  hashPassword,
  isValidStringID,
  parseIntoObjectIDs,
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
      || (temporaryPassword !== undefined
        && temporaryPassword !== user.temporaryPassword)
      || hashPassword(password) !== user.password
    ) {
      return { error: "Either user doesn't exist, or password is incorrect." };
    }
    return sanitizeUser(user);
  }

  public async fetchAll() {
    return this.db.collection(USERS_COLLECTION).find().toArray();
  }

  /**
   * Authenticated routes
   */

  public async getUser(id: string) {
    return this.getManyUsers([id]);
  }

  public async getManyUsers(
    ids: string[] | mongo.ObjectId[],
  ): Promise<IFullUser[]> {
    return handleError(async () => {
      const finalIds = isValidStringID(ids) ? parseIntoObjectIDs(ids) : ids;
      const allUsers = await this.db
        .collection(USERS_COLLECTION)
        .find({ _id: { $in: finalIds } });
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

  public async indexUserEvents(
    userIds: mongo.ObjectId[],
    eventId: mongo.ObjectId,
  ) {
    return this.changeUserIndex(userIds, eventId, this.appendConnection);
  }

  public async removeIndexUserEvents(
    eventId: mongo.ObjectId,
    originalEvent: IEvent,
  ) {
    return this.changeUserIndex(
      [originalEvent.host, ...originalEvent.attendees],
      eventId,
      this.removeConnection,
    );
  }

  /**
   * Utils
   */

  private retrieveUserWithPhoneNumber(
    phoneNumber: string,
  ): Promise<IFullUser | null> {
    return this.fetchUser({ phoneNumber: sanitizePhoneNumber(phoneNumber) });
  }

  private retrieveUserWithID(id: mongo.ObjectId): Promise<IFullUser | null> {
    return this.fetchUser({ _id: id });
  }

  private async fetchUser(query: any): Promise<IFullUser | null> {
    const fetchUser = await this.db.collection(USERS_COLLECTION).find(query);
    return fetchUser.next();
  }

  private async changeUserIndex(
    userIds: mongo.ObjectId[],
    eventId: mongo.ObjectId,
    mapping: (
      singleUser: IFullUser,
      appendIds: mongo.ObjectId[],
      eventId: mongo.ObjectId,
    ) => IFullUser,
  ) {
    const allUsers = await this.getManyUsers(userIds);
    const usersWithConnections = allUsers.map(
      (singleUser: IFullUser) => mapping(singleUser, userIds, eventId),
    );
    const allUpdates = await Promise.all(
      usersWithConnections.map((singleUser: IFullUser) => this.db
        .collection(USERS_COLLECTION)
        .updateOne({ _id: singleUser._id }, { $set: { ...singleUser } })),
    );
    return allUpdates;
  }

  private appendConnection = (
    singleUser: IFullUser,
    appendIds: mongo.ObjectId[],
    eventId: mongo.ObjectId,
  ) => {
    const copyUser = { ...singleUser };
    if (copyUser.connections === undefined) {
      copyUser.connections = {};
    }
    appendIds.forEach((id) => {
      copyUser.connections[id.toHexString()] = [
        ...(copyUser.connections[id.toHexString()] || []),
        eventId,
      ];
    });
    return copyUser;
  }

  private removeConnection = (
    singleUser: IFullUser,
    removeIds: mongo.ObjectId[],
    eventId: mongo.ObjectId,
  ) => {
    const copyUser = { ...singleUser };
    if (copyUser.connections === undefined) {
      return copyUser;
    }
    removeIds.forEach((id) => {
      let connections = copyUser.connections[id.toHexString()];
      connections = connections.splice(connections.indexOf(eventId), 1);
    });
    return copyUser;
  }
}
