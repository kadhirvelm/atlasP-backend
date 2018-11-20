import mongo from "mongodb";

import { IFullUser, IUser, USERS_COLLECTION } from "./userConstants";

import { IEvent } from "../events";
import {
  fullSanitizeUser,
  handleError,
  hashPassword,
  parseIntoObjectIDs,
  sanitizePhoneNumber,
  sanitizeUser
} from "../utils";
import { UserDatabaseUtils } from "./usersDatabaseUtils";

export class UserDatabase {
  private userDatabaseUtils: UserDatabaseUtils;

  constructor(private db: mongo.Db) {
    this.userDatabaseUtils = new UserDatabaseUtils(db);
  }

  /**
   * Public routes
   */

  public createNewUser(user: IUser, createdBy?: mongo.ObjectId) {
    return handleError(async () => {
      const finalUser = {
        ...user,
        createdBy,
        phoneNumber: sanitizePhoneNumber(user.phoneNumber)
      };
      const newUser = await this.db
        .collection(USERS_COLLECTION)
        .insertOne(finalUser);
      return { newUser, _id: newUser.insertedId };
    });
  }

  public async claim(phoneNumber: string) {
    const user = await this.userDatabaseUtils.retrieveUserWithPhoneNumber(
      phoneNumber
    );
    if (user == null || user.claimed) {
      return {
        error:
          "Phone number is not in the database or user has already been claimed."
      };
    }
    const updatedUser = {
      ...user,
      claimed: true,
      temporaryPassword: Math.round(1000 + Math.random() * 9999)
    };
    await this.db
      .collection(USERS_COLLECTION)
      .updateOne({ _id: user._id }, { $set: updatedUser });
    return { _id: user._id, temporaryPassword: updatedUser.temporaryPassword };
  }

  public async login(
    phoneNumber: string,
    password: string,
    temporaryPassword?: number
  ) {
    const user = await this.userDatabaseUtils.retrieveUserWithPhoneNumber(
      phoneNumber
    );
    if (
      user == null ||
      (temporaryPassword !== undefined &&
        temporaryPassword !== user.temporaryPassword) ||
      (password !== undefined && hashPassword(password) !== user.password)
    ) {
      return { error: "These are invalid credentials." };
    }
    return sanitizeUser(user);
  }

  public async resetClaimed(phoneNumber: string) {
    const user = await this.userDatabaseUtils.retrieveUserWithPhoneNumber(
      phoneNumber
    );
    if (user == null) {
      return;
    }
    await this.updateUser(user._id, { claimed: false });
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

  public async getUser(id: string, shouldFullySanitize = true) {
    return this.getManyUsers([id], shouldFullySanitize);
  }

  public async getManyUsers(
    ids: string[],
    shouldFullySanitize: boolean = true
  ): Promise<IFullUser[]> {
    return handleError(async () => {
      const finalIds = parseIntoObjectIDs(ids);
      const allUsers = await this.db
        .collection(USERS_COLLECTION)
        .find({ _id: { $in: finalIds } });
      const finalUsers = (await allUsers.toArray()) as IFullUser[];
      return shouldFullySanitize
        ? finalUsers.map(fullSanitizeUser)
        : finalUsers.map(user => sanitizeUser(user).userDetails);
    });
  }

  public async updateUser(
    userID: mongo.ObjectId,
    newUserDetails: Partial<IFullUser>
  ) {
    const user = await this.userDatabaseUtils.retrieveUserWithID(userID);
    const newDetails = { ...newUserDetails };
    if (newDetails.password !== undefined) {
      newDetails.password = hashPassword(newDetails.password);
      delete user.temporaryPassword;
      delete newDetails.temporaryPassword;
    }
    const updatedUser: IFullUser = { ...user, ...newDetails };
    return handleError(async () => {
      const finalUpdatedUser = await this.db
        .collection(USERS_COLLECTION)
        .replaceOne({ _id: userID }, updatedUser);
      return finalUpdatedUser;
    });
  }

  public async updateOtherUser(
    currentUserId: mongo.ObjectId,
    userId: string,
    newUserDetails: Partial<IFullUser>
  ) {
    const user = await this.userDatabaseUtils.retrieveUserWithID(
      new mongo.ObjectId(userId)
    );
    if (user.claimed === true && !user._id.equals(currentUserId)) {
      return {
        error: "We cannot update a claimed user's account details."
      };
    }
    return this.updateUser(user._id, newUserDetails);
  }

  public async addConnectionToGraph(
    userID: mongo.ObjectId,
    phoneNumber: string
  ) {
    const addUser = await this.userDatabaseUtils.retrieveUserWithPhoneNumber(
      phoneNumber
    );
    if (addUser == null) {
      return {
        error: `Hum, we can't seem to find anyone with the number: ${phoneNumber}`
      };
    }

    const currentUser = await this.userDatabaseUtils.retrieveUserWithID(userID);
    if (currentUser.connections[addUser._id.toHexString()] !== undefined) {
      return {
        error: `You already have ${addUser.name} on your graph.`
      };
    }

    await this.updateUser(currentUser._id, {
      connections: {
        ...currentUser.connections,
        [addUser._id.toHexString()]: []
      }
    });
    await this.updateUser(addUser._id, {
      connections: {
        ...addUser.connections,
        [currentUser._id.toHexString()]: []
      }
    });
    return {
      message: `Successfully added ${addUser.name} to your graph.`,
      user: fullSanitizeUser(addUser)
    };
  }

  public async removeConnectionFromGraph(
    userID: mongo.ObjectId,
    removeConnectionId: string
  ) {
    const user = await this.userDatabaseUtils.retrieveUserWithID(userID);
    const userConnectionCopy = { ...user.connections };
    if (userConnectionCopy[removeConnectionId] === undefined) {
      throw new Error("Cannot remove a non-empty connection.");
    }
    delete userConnectionCopy[removeConnectionId];
    await this.updateUser(userID, {
      connections: { ...userConnectionCopy }
    });
    return { ...user, connections: userConnectionCopy };
  }

  public async indexUserEvents(
    userIds: mongo.ObjectId[],
    eventId?: mongo.ObjectId
  ) {
    return this.userDatabaseUtils.changeUserIndex(
      userIds,
      eventId,
      this.userDatabaseUtils.appendConnection
    );
  }

  public async removeIndexUserEvents(
    eventId: mongo.ObjectId,
    originalEvent: IEvent
  ) {
    return this.userDatabaseUtils.changeUserIndex(
      originalEvent.attendees,
      eventId,
      this.userDatabaseUtils.removeConnection
    );
  }
}
