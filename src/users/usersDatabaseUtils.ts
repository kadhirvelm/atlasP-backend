import mongo from "mongodb";
import { IFullUser, IUserConnections, USERS_COLLECTION } from ".";
import { sanitizePhoneNumber, sanitizeUser } from "../utils";

export class UserDatabaseUtils {
  constructor(private db: mongo.Db) {}

  public retrieveUserWithPhoneNumber(
    phoneNumber: string
  ): Promise<IFullUser | null> {
    return this.fetchUser({ phoneNumber: sanitizePhoneNumber(phoneNumber) });
  }

  public retrieveUserWithID(id: mongo.ObjectId): Promise<IFullUser | null> {
    return this.fetchUser({ _id: id });
  }

  public async fetchUser(query: any): Promise<IFullUser | null> {
    const fetchedUser = await this.db.collection(USERS_COLLECTION).find(query);
    return fetchedUser.next();
  }

  public removeConnection(
    singleUserConnections: IUserConnections,
    removeIds: mongo.ObjectId[],
    eventId: mongo.ObjectId,
    singleUser: IFullUser,
    allUsers: IFullUser[]
  ) {
    const copyUserConnections = { ...singleUserConnections };
    if (copyUserConnections === undefined) {
      return copyUserConnections;
    }
    removeIds.forEach(id => {
      const currentConnections = copyUserConnections[id.toHexString()] || [];
      const connectionIndex = currentConnections.findIndex(connection =>
        connection.equals(eventId)
      );
      if (connectionIndex !== -1) {
        currentConnections.splice(connectionIndex, 1);
        if (
          currentConnections.length === 0 &&
          !id.equals(singleUser._id) &&
          !id.equals(singleUser.createdBy) &&
          !singleUser._id.equals(
            allUsers.find(user => user._id.equals(id)).createdBy
          )
        ) {
          // Note: delete strangers from your graph
          delete copyUserConnections[id.toHexString()];
        }
      }
    });
    return copyUserConnections;
  }

  public async changeUserIndex(
    userIds: mongo.ObjectId[],
    eventId: mongo.ObjectId,
    mapping: (
      singleUserConnections: IUserConnections,
      appendIds: mongo.ObjectId[],
      eventId: mongo.ObjectId,
      singleUser?: IFullUser,
      allUsers?: IFullUser[]
    ) => IUserConnections
  ) {
    const allRawUsers = await this.db
      .collection(USERS_COLLECTION)
      .find({ _id: { $in: userIds } });
    const allUsers = ((await allRawUsers.toArray()) as IFullUser[]).map(
      user => sanitizeUser(user).userDetails
    );
    const usersWithConnections = allUsers.map((singleUser: IFullUser) => ({
      connections: mapping(
        singleUser.connections,
        userIds,
        eventId,
        singleUser,
        allUsers
      ),
      id: singleUser._id
    }));
    for (const singleUser of usersWithConnections) {
      await this.db
        .collection(USERS_COLLECTION)
        .updateOne(
          { _id: singleUser.id },
          { $set: { connections: singleUser.connections } }
        );
    }
    return { message: "Successfully reindexed connection" };
  }

  public appendConnection(
    singleUserConnections: IUserConnections,
    appendIds: mongo.ObjectId[],
    eventId?: mongo.ObjectId
  ) {
    const copyUserConnections = { ...singleUserConnections } || {};
    appendIds.forEach(id => {
      const finalEventId = eventId === undefined ? [] : [eventId];
      const currentConnections = copyUserConnections[id.toHexString()] || [];
      if (!currentConnections.includes(finalEventId[0])) {
        copyUserConnections[id.toHexString()] = currentConnections.concat(
          finalEventId
        );
      }
    });
    return copyUserConnections;
  }
}
