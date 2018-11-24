import { expect } from "chai";
import "mocha";
import mongo from "mongodb";

import { incrementDate } from "../../reports/reportGeneratorUtils";
import {
  generateAuthenticationToken,
  generatePasswordToken
} from "../../utils";
import { IRequestTypes, MongoMock } from "../../utils/__tests__/generalUtils";
import {
  DEFAULT_MONGOID,
  FAKE_PHONE_NUMBERS
} from "../../utils/__tests__/usersUtils";

describe("account", () => {
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

  it("allows a user to check their account status", async () => {
    const newUser = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/users/new",
      {
        gender: "X",
        location: "SF",
        name: "Billy Bob",
        phoneNumber: FAKE_PHONE_NUMBERS[1]
      }
    );
    const userId = newUser.body.payload._id;
    userIds.push(userId);
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userId))
    );
    const checkAccountStatus = await mongoMock.sendRequest(
      IRequestTypes.GET,
      "/account/check",
      {}
    );
    expect(checkAccountStatus.body.payload.isPremium).to.equal(false);
  });

  it("allows an admin to upgrade a user's account to account", async () => {
    const accountToken = generatePasswordToken(process.env.ACCOUNT_PASSWORD);
    mongoMock.setAuthenticationToken(accountToken);
    const response = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/account/upgrade",
      {
        expiration: incrementDate(new Date(), 30),
        userId: userIds[0]
      }
    );
    expect(response.body.payload.isPremium).to.equal(true);
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[0]))
    );
    const checkAccountStatus = await mongoMock.sendRequest(
      IRequestTypes.GET,
      "/account/check",
      {}
    );
    expect(checkAccountStatus.body.payload.isPremium).to.equal(true);
    expect(checkAccountStatus.body.payload.expiration).to.not.equal(undefined);
  });

  it("does not allow an admin to upgrade a user's account to account that is in the past", async () => {
    mongoMock.setAuthenticationToken(
      generatePasswordToken(process.env.ACCOUNT_PASSWORD)
    );
    const response = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/account/upgrade",
      {
        expiration: incrementDate(new Date(), -1),
        userId: userIds[0]
      }
    );
    expect(response.body.message[0]).to.equal(
      "Cannot have an expiration date in the past"
    );
  });
});
