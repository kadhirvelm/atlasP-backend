import { assert, expect } from "chai";
import "mocha";
import mongo from "mongodb";

import { generateAuthenticationToken } from "../../utils";
import { compareEvents } from "../../utils/__tests__/eventsUtils";
import { IRequestTypes, MongoMock } from "../../utils/__tests__/generalUtils";
import {
  convertToMongoObjectId,
  DEFAULT_MONGOID,
  MONGO_ID_1,
  MONGO_ID_2,
  MONGO_ID_3,
  MONGO_ID_4,
  MONGO_ID_5
} from "../../utils/__tests__/usersUtils";

describe("Events", () => {
  let mongoMock: MongoMock;

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

  it("successfully creates an event", async () => {
    const createEventResponse = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/events/new",
      {
        attendees: [DEFAULT_MONGOID, MONGO_ID_1, MONGO_ID_2].map(
          convertToMongoObjectId
        ),
        date: "01/01/2018 10:00 AM",
        description: "Test event"
      }
    );
    assert.deepEqual(createEventResponse.body.payload.newEvent, {
      n: 1,
      ok: 1
    });
    const eventId = createEventResponse.body.payload.id;

    const fetchEventResponse = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/events/getOne",
      { eventId }
    );
    compareEvents(fetchEventResponse.body.payload, {
      attendees: [
        "303030303030303030303030",
        "313030303030303030303030",
        "323030303030303030303030"
      ],
      description: "Test event"
    });
  });

  describe("update events", () => {
    it("successfully updates an event with the same users", async () => {
      const createEventResponse = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/new",
        {
          attendees: [DEFAULT_MONGOID, MONGO_ID_1, MONGO_ID_2].map(
            convertToMongoObjectId
          ),
          date: "01/01/2018 10:00 AM",
          description: "Test event 1"
        }
      );
      const eventId = createEventResponse.body.payload.id;
      expect(eventId).to.not.equal(undefined);

      const secondUpdate = await mongoMock.sendRequest(
        IRequestTypes.PUT,
        "/events/update",
        {
          attendees: [DEFAULT_MONGOID, MONGO_ID_1, MONGO_ID_2].map(
            convertToMongoObjectId
          ),
          date: "01/05/2018 11:00 AM",
          description: "New event description",
          eventId
        }
      );
      assert.deepEqual(secondUpdate.body.payload, {
        n: 1,
        nModified: 1,
        ok: 1,
        updatedUser: []
      });

      const fetchEventResponse = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/getOne",
        {
          eventId
        }
      );
      compareEvents(fetchEventResponse.body.payload, {
        attendees: [
          "303030303030303030303030",
          "313030303030303030303030",
          "323030303030303030303030"
        ],
        description: "New event description"
      });
    });

    it("successfully updates an event with different users", async () => {
      const createEventResponse = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/new",
        {
          attendees: [DEFAULT_MONGOID, MONGO_ID_1, MONGO_ID_2].map(
            convertToMongoObjectId
          ),
          date: "01/01/2018 10:00 AM",
          description: "Test event 1"
        }
      );
      const eventId = createEventResponse.body.payload.id;
      expect(eventId).to.not.equal(undefined);

      const secondUpdate = await mongoMock.sendRequest(
        IRequestTypes.PUT,
        "/events/update",
        {
          attendees: [
            DEFAULT_MONGOID,
            MONGO_ID_1,
            MONGO_ID_3,
            MONGO_ID_4,
            MONGO_ID_5
          ].map(convertToMongoObjectId),
          date: "01/05/2018 11:00 AM",
          description: "New event description",
          eventId
        }
      );
      assert.deepEqual(secondUpdate.body.payload, {
        n: 1,
        nModified: 1,
        ok: 1,
        updatedUser: []
      });

      const fetchEventResponse = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/getOne",
        {
          eventId
        }
      );
      compareEvents(fetchEventResponse.body.payload, {
        attendees: [
          "303030303030303030303030",
          "313030303030303030303030",
          "333030303030303030303030",
          "343030303030303030303030",
          "353030303030303030303030"
        ],
        description: "New event description"
      });
    });
  });

  describe("Events with real users", () => {
    let userIDs: string[] = [];
    const eventIds: string[] = [];

    before(done => {
      setTimeout(async () => {
        userIDs = await mongoMock.createUsers(
          DEFAULT_MONGOID,
          MONGO_ID_1,
          MONGO_ID_2,
          MONGO_ID_3,
          MONGO_ID_4,
          MONGO_ID_5
        );
        mongoMock.setAuthenticationToken(
          generateAuthenticationToken(new mongo.ObjectId(userIDs[0]))
        );
        done();
      }, 100);
    });

    it("correctly indexes events", async () => {
      const createEventResponse = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/new",
        {
          attendees: userIDs.slice(0, 3),
          date: "01/01/2018 10:00 AM",
          description: "First event"
        }
      );
      expect(createEventResponse.body.message).to.equal(
        "Attempted to create new event"
      );
      const firstEventId = createEventResponse.body.payload.id;
      eventIds.push(firstEventId);
      expect(firstEventId).to.not.equal(undefined);

      const getUserRequest = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/users/getOne",
        {
          id: userIDs[0]
        }
      );
      assert.deepEqual(getUserRequest.body.payload[0].connections, {
        [userIDs[0]]: [firstEventId],
        [userIDs[1]]: [firstEventId],
        [userIDs[2]]: [firstEventId]
      });

      const createSecondEvent = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/new",
        {
          attendees: [userIDs[0], ...userIDs.slice(2)],
          date: "01/05/2018 10:00 AM",
          description: "Second event"
        }
      );
      expect(createSecondEvent.body.message).to.equal(
        "Attempted to create new event"
      );
      const secondEventId = createSecondEvent.body.payload.id;
      eventIds.push(secondEventId);
      expect(secondEventId).to.not.equal(undefined);

      const getSecondUserRequest = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/users/getOne",
        {
          id: userIDs[0]
        }
      );
      assert.deepEqual(getSecondUserRequest.body.payload[0].connections, {
        [userIDs[0]]: [firstEventId, secondEventId],
        [userIDs[1]]: [firstEventId],
        [userIDs[2]]: [firstEventId, secondEventId],
        [userIDs[3]]: [secondEventId],
        [userIDs[4]]: [secondEventId],
        [userIDs[5]]: [secondEventId]
      });

      const getUserFiveRequest = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/users/getOne",
        {
          id: userIDs[5]
        },
        generateAuthenticationToken(new mongo.ObjectId(userIDs[5]))
      );
      assert.deepEqual(getUserFiveRequest.body.payload[0].connections, {
        [userIDs[5]]: [secondEventId],
        [userIDs[4]]: [secondEventId],
        [userIDs[3]]: [secondEventId],
        [userIDs[2]]: [secondEventId],
        [userIDs[0]]: [secondEventId]
      });
    });

    it("correctly reindexes events with the same users", async () => {
      const createEventResponse = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/new",
        {
          attendees: userIDs,
          date: "01/10/2018 10:00 AM",
          description: "Third event"
        }
      );
      expect(createEventResponse.body.message).to.equal(
        "Attempted to create new event"
      );
      const thirdEvent = createEventResponse.body.payload.id;
      eventIds.push(thirdEvent);
      expect(thirdEvent).to.not.equal(undefined);

      const firstGetUsers = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/users/getOne",
        {
          id: userIDs[0]
        }
      );
      assert.deepEqual(firstGetUsers.body.payload[0].connections, {
        [userIDs[0]]: [eventIds[0], eventIds[1], eventIds[2]],
        [userIDs[1]]: [eventIds[0], eventIds[2]],
        [userIDs[2]]: [eventIds[0], eventIds[1], eventIds[2]],
        [userIDs[3]]: [eventIds[1], eventIds[2]],
        [userIDs[4]]: [eventIds[1], eventIds[2]],
        [userIDs[5]]: [eventIds[1], eventIds[2]]
      });

      const updateRequest = await mongoMock.sendRequest(
        IRequestTypes.PUT,
        "/events/update",
        {
          attendees: userIDs,
          date: "01/12/2018 11:00 AM",
          description: "New third event description",
          eventId: thirdEvent
        }
      );
      expect(updateRequest.body.payload).to.not.equal(undefined);

      const secondGetUsers = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/users/getOne",
        {
          id: userIDs[0]
        }
      );
      assert.deepEqual(secondGetUsers.body.payload[0].connections, {
        [userIDs[0]]: [eventIds[0], eventIds[1], eventIds[2]],
        [userIDs[1]]: [eventIds[0], eventIds[2]],
        [userIDs[2]]: [eventIds[0], eventIds[1], eventIds[2]],
        [userIDs[3]]: [eventIds[1], eventIds[2]],
        [userIDs[4]]: [eventIds[1], eventIds[2]],
        [userIDs[5]]: [eventIds[1], eventIds[2]]
      });
    });

    it("correctly reindexes events with different users", async () => {
      const createEventResponse = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/new",
        {
          attendees: userIDs,
          date: "01/10/2018 10:00 AM",
          description: "Third event"
        }
      );
      expect(createEventResponse.body.message).to.equal(
        "Attempted to create new event"
      );
      const fourthEvent = createEventResponse.body.payload.id;
      eventIds.push(fourthEvent);
      expect(fourthEvent).to.not.equal(undefined);

      const firstGetUsers = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/users/getOne",
        {
          id: userIDs[0]
        }
      );
      assert.deepEqual(firstGetUsers.body.payload[0].connections, {
        [userIDs[0]]: [eventIds[0], eventIds[1], eventIds[2], eventIds[3]],
        [userIDs[1]]: [eventIds[0], eventIds[2], eventIds[3]],
        [userIDs[2]]: [eventIds[0], eventIds[1], eventIds[2], eventIds[3]],
        [userIDs[3]]: [eventIds[1], eventIds[2], eventIds[3]],
        [userIDs[4]]: [eventIds[1], eventIds[2], eventIds[3]],
        [userIDs[5]]: [eventIds[1], eventIds[2], eventIds[3]]
      });

      const updateRequest = await mongoMock.sendRequest(
        IRequestTypes.PUT,
        "/events/update",
        {
          attendees: userIDs.slice(0, 3),
          date: "01/12/2018 11:00 AM",
          description: "New third event description",
          eventId: fourthEvent
        }
      );
      expect(updateRequest.body.payload).to.not.equal(undefined);

      const secondGetUsers = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/users/getOne",
        {
          id: userIDs[0]
        }
      );
      assert.deepEqual(secondGetUsers.body.payload[0].connections, {
        [userIDs[0]]: [eventIds[0], eventIds[1], eventIds[2], eventIds[3]],
        [userIDs[1]]: [eventIds[0], eventIds[2], eventIds[3]],
        [userIDs[2]]: [eventIds[0], eventIds[1], eventIds[2], eventIds[3]],
        [userIDs[3]]: [eventIds[1], eventIds[2]],
        [userIDs[4]]: [eventIds[1], eventIds[2]],
        [userIDs[5]]: [eventIds[1], eventIds[2]]
      });

      const getUserFiveRequest = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/users/getOne",
        {
          id: userIDs[5]
        },
        generateAuthenticationToken(new mongo.ObjectId(userIDs[5]))
      );
      assert.deepEqual(getUserFiveRequest.body.payload[0].connections, {
        [userIDs[5]]: [eventIds[1], eventIds[2]],
        [userIDs[4]]: [eventIds[1], eventIds[2]],
        [userIDs[3]]: [eventIds[1], eventIds[2]],
        [userIDs[2]]: [eventIds[1], eventIds[2]],
        [userIDs[1]]: [eventIds[2]],
        [userIDs[0]]: [eventIds[1], eventIds[2]]
      });
    });

    it("allows a user to delete an event", async () => {
      generateAuthenticationToken(new mongo.ObjectId(userIDs[0]));
      const createEventResponse = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/new",
        {
          attendees: [userIDs[0], userIDs[1]],
          date: "01/11/2018 10:00 AM",
          description: "Delete me!"
        }
      );
      expect(createEventResponse.body.message).to.equal(
        "Attempted to create new event"
      );
      const deleteEventResponse = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/delete",
        {
          eventId: createEventResponse.body.payload.id
        }
      );
      expect(deleteEventResponse.body.payload).to.not.equal(undefined);
      const getEvent = await mongoMock.sendRequest(
        IRequestTypes.POST,
        "/events/getOne",
        {
          eventId: createEventResponse.body.payload.id
        }
      );
      expect(getEvent.body.payload).to.equal(undefined);
    });
  });
});
