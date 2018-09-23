import mongo from "mongodb";

import {
  IFullUser,
  IUser,
  IUserConnections,
  USERS_COLLECTION,
} from "./userConstants";

import { IEvent } from "../events";
import {
  fullSanitizeUser,
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
      return { newUser, _id: newUser.insertedId };
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
      .updateOne({ _id: user._id }, { $set: updatedUser });
    return { _id: user._id, temporaryPassword: updatedUser.temporaryPassword };
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
      || (password !== undefined && hashPassword(password) !== user.password)
    ) {
      return { error: "These are invalid credentials." };
    }
    return sanitizeUser(user);
  }

  public async removeAllConnections() {
    return this.db
      .collection(USERS_COLLECTION)
      .updateMany({}, { $set: { connections: {} } });
  }

  public async fetchAll() {
    return this.db
      .collection(USERS_COLLECTION)
      .find()
      .toArray();
  }

  /**
   * Authenticated routes
   */

  public async getUser(id: string, shouldFullySanitize: boolean = true) {
    return this.getManyUsers([id], shouldFullySanitize);
  }

  public async getManyUsers(
    ids: string[] | mongo.ObjectId[],
    sanitize: boolean = true,
  ): Promise<IFullUser[]> {
    return handleError(async () => {
      const finalIds = isValidStringID(ids) ? parseIntoObjectIDs(ids) : ids;
      const allUsers = await this.db
        .collection(USERS_COLLECTION)
        .find({ _id: { $in: finalIds } });
      const finalUsers = (await allUsers.toArray()) as IFullUser[];
      return sanitize
        ? finalUsers.map(fullSanitizeUser)
        : finalUsers.map((user) => sanitizeUser(user).userDetails);
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
    eventId?: mongo.ObjectId,
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
      singleUserConnections: IUserConnections,
      appendIds: mongo.ObjectId[],
      eventId: mongo.ObjectId,
    ) => IUserConnections,
  ) {
    const allUsers = await this.getManyUsers(userIds, false);
    const usersWithConnections = allUsers.map((singleUser: IFullUser) => ({
      connections: mapping(singleUser.connections, userIds, eventId),
      id: singleUser._id,
    }));
    for (const singleUser of usersWithConnections) {
      await this.db
        .collection(USERS_COLLECTION)
        .updateOne(
          { _id: singleUser.id },
          { $set: { connections: singleUser.connections } },
        );
    }
    return { message: "Successfully reindexed connection" };
  }

  private appendConnection = (
    singleUserConnections: IUserConnections,
    appendIds: mongo.ObjectId[],
    eventId?: mongo.ObjectId,
  ) => {
    const copyUserConnections = { ...singleUserConnections } || {};
    appendIds.forEach((id) => {
      const finalEventId = eventId === undefined ? [] : [eventId];
      const currentConnections = copyUserConnections[id.toHexString()] || [];
      if (!currentConnections.includes(finalEventId[0])) {
        copyUserConnections[id.toHexString()] = currentConnections.concat(
          finalEventId,
        );
      }
    });
    return copyUserConnections;
  }

  private removeConnection = (
    singleUserConnections: IUserConnections,
    removeIds: mongo.ObjectId[],
    eventId: mongo.ObjectId,
  ) => {
    const copyUserConnections = { ...singleUserConnections };
    if (copyUserConnections === undefined) {
      return copyUserConnections;
    }
    removeIds.forEach((id) => {
      let currentConnections = copyUserConnections[id.toHexString()] || [];
      if (currentConnections.includes(eventId)) {
        currentConnections = currentConnections.splice(
          currentConnections.indexOf(eventId),
          1,
        );
      }
    });
    return copyUserConnections;
  }
}
