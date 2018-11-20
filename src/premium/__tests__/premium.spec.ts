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

describe.only("Premium", () => {
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

  it("allows a user to check their premium status", async () => {
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
    const checkPremiumStatus = await mongoMock.sendRequest(
      IRequestTypes.GET,
      "/premium/check",
      {}
    );
    expect(checkPremiumStatus.body.payload.isPremium).to.equal(false);
  });

  it("allows an admin to upgrade a user's account to premium", async () => {
    const premiumToken = generatePasswordToken(process.env.PREMIUM_PASSWORD);
    mongoMock.setAuthenticationToken(premiumToken);
    const response = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/premium/upgrade",
      {
        expiration: incrementDate(new Date(), 30),
        userId: userIds[0]
      }
    );
    expect(response.body.payload.isPremium).to.equal(true);
    mongoMock.setAuthenticationToken(
      generateAuthenticationToken(new mongo.ObjectId(userIds[0]))
    );
    const checkPremiumStatus = await mongoMock.sendRequest(
      IRequestTypes.GET,
      "/premium/check",
      {}
    );
    expect(checkPremiumStatus.body.payload.isPremium).to.equal(true);
    expect(checkPremiumStatus.body.payload.expiration).to.not.equal(undefined);
  });

  it("does not allow an admin to upgrade a user's account to premium that is in the past", async () => {
    mongoMock.setAuthenticationToken(
      generatePasswordToken(process.env.PREMIUM_PASSWORD)
    );
    const response = await mongoMock.sendRequest(
      IRequestTypes.POST,
      "/premium/upgrade",
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
