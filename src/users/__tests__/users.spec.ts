import { assert, expect } from "chai";
import "mocha";
import mongo from "mongodb";

import { generateAuthenticationToken } from "../../utils";
import { IRequestTypes, MongoMock } from "../../utils/__tests__/generalUtils";
import {
  convertToMongoObjectId,
  DEFAULT_MONGOID
} from "../../utils/__tests__/usersUtils";

describe("Users", () => {
  let mongoMock: MongoMock;
  const userIds: string[] = [];

  before(async () => {
    mongoMock = new MongoMock();
    await mongoMock.mountDatabase();
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(DEFAULT_MONGOID))
    );
  });

  after(async () => {
    await mongoMock.close();
  });

  it("correctly adds a createdBy field", async () => {
    const createUser = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/new-user",
      {
        gender: "X",
        location: "SF",
        name: "Bob A",
        // Note: This is a fake number
        phoneNumber: "2025550170"
      }
    );
    userIds.push(createUser.body.payload.newUserId);
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[0]))
    );
    const getUser = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: userIds[0]
      }
    );
    const defaultID = new mongo.ObjectId(DEFAULT_MONGOID).toHexString();
    assert.deepEqual(getUser.body.payload[0], {
      _id: userIds[0],
      connections: {
        [defaultID]: [],
        [userIds[0]]: []
      },
      createdBy: defaultID,
      gender: "X",
      location: "SF",
      name: "Bob A",
      phoneNumber: "2025550170"
    });
  });

  it("allows a user to claim their account using their phone number", async () => {
    const claimUser = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/claim",
      {
        phoneNumber: "2025550170"
      }
    );
    expect(claimUser.body.payload.temporaryPassword).to.not.equal(undefined);
  });

  it("correctly sanitizes users when fetching them", async () => {
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(DEFAULT_MONGOID))
    );
    const getUser = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: userIds[0]
      }
    );
    assert.deepEqual(getUser.body.payload[0], {
      _id: userIds[0],
      claimed: true,
      gender: "X",
      location: "SF",
      name: "Bob A"
    });
  });

  it("correctly reindexes events after editing them", async () => {
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[0]))
    );
    const createUser2 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/new-user",
      {
        gender: "X",
        location: "SF",
        name: "Joe B",
        // Note: This is a fake number
        phoneNumber: "2025550158"
      }
    );
    userIds.push(createUser2.body.payload.newUserId);
    const createUser3 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/new-user",
      {
        gender: "X",
        location: "SF",
        name: "Calvin C",
        // Note: This is a fake number
        phoneNumber: "2025550123"
      }
    );
    userIds.push(createUser3.body.payload.newUserId);

    const createEventResponse = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/events/new",
      {
        attendees: [userIds[0], userIds[1], userIds[2]].map(
          convertToMongoObjectId
        ),
        date: "01/01/2018 10:00 AM",
        description: "Test event"
      }
    );
    const eventId = createEventResponse.body.payload.id;
    expect(createEventResponse.body.payload).to.not.equal(undefined);

    const updatedEvent = await mongoMock.sendRequest(
      IRequestTypes.PUT,
      "/events/update",
      {
        attendees: [userIds[0], userIds[1]].map(convertToMongoObjectId),
        date: "01/05/2018 11:00 AM",
        description: "New event description",
        eventId
      }
    );
    expect(updatedEvent.body.payload).to.not.equal(undefined);

    const getUser1 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: userIds[0]
      }
    );
    assert.deepEqual(getUser1.body.payload[0].connections, {
      [new mongo.ObjectId(DEFAULT_MONGOID).toHexString()]: [],
      [userIds[0]]: [eventId],
      [userIds[1]]: [eventId],
      [userIds[2]]: []
    });

    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[1]))
    );
    const getUser2 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: userIds[1]
      }
    );
    assert.deepEqual(getUser2.body.payload[0].connections, {
      [userIds[0]]: [eventId],
      [userIds[1]]: [eventId]
    });

    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[2]))
    );
    const getUser3 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: userIds[2]
      }
    );
    assert.deepEqual(getUser3.body.payload[0].connections, {
      [userIds[0]]: [],
      [userIds[2]]: []
    });
  });

  it("allows a user to remove another empty user from their graph", async () => {
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[0]))
    );
    await mongoMock.sendRequest(IRequestTypes.PUT, "/users/update", {
      password: "TEST_PASSWORD_1"
    });
    const login = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/login",
      {
        password: "TEST_PASSWORD_1",
        phoneNumber: "2025550170"
      }
    );
    expect(login.body.payload).to.not.equal(undefined);
    mongoMock.setAuthenticationToken(login.body.payload.token);
    const removeUser2 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/remove-connection",
      {
        removeConnection: userIds[2]
      }
    );
    expect(removeUser2.body.payload).to.not.equal(undefined);
    const getUser1 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: userIds[0]
      }
    );
    expect(getUser1.body.payload[0].connections[userIds[2]]).to.equal(
      undefined
    );
    const login2 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/login",
      {
        password: "TEST_PASSWORD_1",
        phoneNumber: "2025550170"
      }
    );
    expect(login2.body.payload.token).to.not.equal(undefined);
  });

  it("allows a user to an another to their ignore list", async () => {
    const response = await mongoMock.sendRequest(
      IRequestTypes.PUT,
      "/users/update",
      {
        gender: "X",
        ignoreUsers: [userIds[1]],
        location: "SF",
        name: "Bob A",
        phoneNumber: "2025550170"
      }
    );
    assert.deepEqual(response.body.payload, {
      n: 1,
      nModified: 1,
      ok: 1
    });
    const getUser = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: userIds[0]
      }
    );
    expect(getUser.body.payload[0].ignoreUsers).to.have.length(1);
    expect(getUser.body.payload[0].ignoreUsers[0]).to.equal(userIds[1]);
  });

  it("allows a user to reset their claimed status", async () => {
    const claim1 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/claim",
      {
        phoneNumber: "2025550170"
      }
    );
    expect(claim1.body.payload.error).to.equal(
      "Phone number is not in the database or user has already been claimed."
    );
    const reset = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/reset",
      {
        phoneNumber: "2025550170"
      }
    );
    expect(reset.body.payload.message).to.equal(
      "If this phone number exists in our database, it has been reset."
    );
    const claim2 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/claim",
      {
        phoneNumber: "2025550170"
      }
    );
    expect(claim2.body.payload.temporaryPassword).to.not.equal(undefined);
  });

  it("allows a user to update another user's details", async () => {
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[0]))
    );
    const updateUser2 = await mongoMock.sendRequest(
      IRequestTypes.PUT,
      "/users/update-other",
      {
        newUserDetails: {
          name: "UPDATE USER 2 NAME JOE"
        },
        userId: userIds[1]
      }
    );
    assert.deepEqual(updateUser2.body.payload, {
      n: 1,
      nModified: 1,
      ok: 1
    });
    const getUser2 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: userIds[1]
      }
    );
    expect(getUser2.body.payload[0].name).to.equal("UPDATE USER 2 NAME JOE");
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[1]))
    );
    const updateUser1 = await mongoMock.sendRequest(
      IRequestTypes.PUT,
      "/users/update-other",
      {
        newUserDetails: {
          name: "CANNOT UPDATE TO THIS NAME"
        },
        userId: userIds[0]
      }
    );
    expect(updateUser1.body.payload.error).to.equal(
      "We cannot update a claimed user's account details."
    );
  });

  it("allows a user to add another through their phone number", async () => {
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[0]))
    );
    const createdUser = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/new",
      {
        gender: "X",
        location: "SF",
        name: "Add me!",
        // Note: This is a fake number
        phoneNumber: "2025550191"
      }
    );
    const addUserToGraph = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/add-connection",
      {
        phoneNumber: "2025550191"
      }
    );
    expect(addUserToGraph.body.payload.message).to.equal(
      "Successfully added Add me! to your graph."
    );
    const getUser = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: userIds[0]
      }
    );
    expect(
      getUser.body.payload[0].connections[createdUser.body.payload._id]
    ).to.have.length(0);

    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(
        new mongo.ObjectId(createdUser.body.payload._id)
      )
    );
    const getUser2 = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/getOne",
      {
        id: createdUser.body.payload._id
      }
    );
    assert.deepEqual(getUser2.body.payload[0].connections, {
      [userIds[0]]: []
    });
  });
});
