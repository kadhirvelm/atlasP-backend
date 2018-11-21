import { expect } from "chai";
import "mocha";
import mongo from "mongodb";

import { generateAuthenticationToken } from "../../utils";
import { IRequestTypes, MongoMock } from "../../utils/__tests__/generalUtils";
import {
  DEFAULT_MONGOID,
  FAKE_PHONE_NUMBERS
} from "../../utils/__tests__/usersUtils";

describe("Relationships", () => {
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

  it("allows a user to an another to their ignore list", async () => {
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
      ignoreUsers: [DEFAULT_MONGOID]
    });
    const ignoredUsers = await mongoMock.sendRequest(
      IRequestTypes.GET,
      "/relationships/all",
      {}
    );
    expect(ignoredUsers.body.payload.ignoreUsers[0]).to.equal(DEFAULT_MONGOID);
  });
});
