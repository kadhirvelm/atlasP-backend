import { assert, expect } from "chai";
import "mocha";
import mongo from "mongodb";

import { generateAuthenticationToken } from "../../utils";
import { IRequestTypes, MongoMock } from "../../utils/__tests__/generalUtils";
import {
  DEFAULT_MONGOID,
  FAKE_PHONE_NUMBERS,
  MONGO_ID_1
} from "../../utils/__tests__/usersUtils";

describe.only("Relationships", () => {
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

  it("allows a user to change the frequency at which they see another user", async () => {
    const newUserA = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/new",
      {
        gender: "X",
        location: "SF",
        name: "Bob A",
        phoneNumber: FAKE_PHONE_NUMBERS[0]
      }
    );
    userIds.push(newUserA.body.payload._id);
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[0]))
    );
    await mongoMock.sendRequest(IRequestTypes.POST, "/relationships/update", {
      frequency: {
        [DEFAULT_MONGOID]: "IGNORE"
      }
    });
    const relationships = await mongoMock.sendRequest(
      IRequestTypes.GET,
      "/relationships/all",
      {}
    );
    expect(relationships.body.payload.frequency[DEFAULT_MONGOID]).to.equal(
      "IGNORE"
    );
    await mongoMock.sendRequest(IRequestTypes.POST, "/relationships/update", {
      frequency: {
        [DEFAULT_MONGOID]: 60,
        [MONGO_ID_1]: 30
      }
    });
    const secondRelationships = await mongoMock.sendRequest(
      IRequestTypes.GET,
      "/relationships/all",
      {}
    );
    expect(
      secondRelationships.body.payload.frequency[DEFAULT_MONGOID]
    ).to.equal(60);
    expect(secondRelationships.body.payload.frequency[MONGO_ID_1]).to.equal(30);
    await mongoMock.sendRequest(IRequestTypes.POST, "/relationships/update", {
      frequency: {
        [MONGO_ID_1]: "IGNORE"
      }
    });
    const thirdRelationships = await mongoMock.sendRequest(
      IRequestTypes.GET,
      "/relationships/all",
      {}
    );
    expect(thirdRelationships.body.payload.frequency[MONGO_ID_1]).to.equal(
      "IGNORE"
    );
    assert.deepEqual(thirdRelationships.body.payload.frequency, {
      [MONGO_ID_1]: "IGNORE",
      [DEFAULT_MONGOID]: 60
    });
  });
});
