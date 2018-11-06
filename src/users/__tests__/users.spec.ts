import { assert, expect } from "chai";
import "mocha";
import mongo from "mongodb";

import { generateAuthenticationToken } from "../../utils";
import { compareEvents } from "../../utils/__tests__/eventsUtils";
import { IRequestTypes, MongoMock } from "../../utils/__tests__/generalUtils";
import {
  convertToMongoObjectId, DEFAULT_MONGOID, MONGO_ID_1, MONGO_ID_2, MONGO_ID_3, MONGO_ID_4, MONGO_ID_5,
} from "../../utils/__tests__/usersUtils";

describe.only("Users", () => {
  let mongoMock: MongoMock;
  const userIds: string[] = [];

  before(async () => {
    mongoMock = new MongoMock();
    await mongoMock.mountDatabase();
    mongoMock.setAuthenticationToken(generateAuthenticationToken(new mongo.ObjectId(DEFAULT_MONGOID)));
  });

  after(async () => {
    await mongoMock.close();
  });

  it("correctly adds a createdBy field", async () => {
    const createUser = await mongoMock.sendRequest(IRequestTypes.POST, "/users/new-user", {
        gender: "X",
        location: "SF",
        name: "Bob A",
        // Note: This is a fake number
        phoneNumber: "2025550170",
    });
    userIds.push(createUser.body.payload.newUserId);
    const getUser = await mongoMock.sendRequest(IRequestTypes.POST, "/users/getOne", {
        id: createUser.body.payload.newUserId,
    });
    assert.deepEqual(getUser.body.payload[0], {
        _id: userIds[0],
        createdBy: new mongo.ObjectId(DEFAULT_MONGOID).toHexString(),
        gender: "X",
        location: "SF",
        name: "Bob A",
        phoneNumber: "2025550170",
    });
  });

  it("correctly reindexes events after editing them", async () => {
    const createUser2 = await mongoMock.sendRequest(IRequestTypes.POST, "/users/new-user", {
        gender: "X",
        location: "SF",
        name: "Joe B",
        // Note: This is a fake number
        phoneNumber: "2025550158",
    });
    userIds.push(createUser2.body.payload.newUserId);
    const createEventResponse = await mongoMock.sendRequest(IRequestTypes.POST, "/events/new", {
        attendees: [DEFAULT_MONGOID, userIds[0], userIds[1]].map(convertToMongoObjectId),
        date: "01/01/2018 10:00 AM",
        description: "Test event",
    });
    const eventId = createEventResponse.body.payload.id;
    expect(createEventResponse.body.payload).to.not.equal(undefined);
    const updatedEvent = await mongoMock.sendRequest(IRequestTypes.PUT, "/events/update", {
        attendees: [DEFAULT_MONGOID, userIds[0]].map(convertToMongoObjectId),
        date: "01/05/2018 11:00 AM",
        description: "New event description",
        eventId,
    });
    expect(updatedEvent.body.payload).to.not.equal(undefined);

    mongoMock.setAuthenticationToken(generateAuthenticationToken(new mongo.ObjectId(userIds[1])));
    const getUser = await mongoMock.sendRequest(IRequestTypes.POST, "/users/getOne", {
        id: userIds[1],
    });
    assert.deepEqual(getUser.body.payload[0].connections, {
        [new mongo.ObjectId(DEFAULT_MONGOID).toHexString()]: [],
        [userIds[1]]: [],
    });

    mongoMock.setAuthenticationToken(generateAuthenticationToken(new mongo.ObjectId(userIds[0])));
    const getUser2 = await mongoMock.sendRequest(IRequestTypes.POST, "/users/getOne", {
        id: userIds[0],
    });
    assert.deepEqual(getUser2.body.payload[0].connections, {
        [new mongo.ObjectId(DEFAULT_MONGOID).toHexString()]: [eventId],
        [userIds[0]]: [eventId],
    });
  });
});
