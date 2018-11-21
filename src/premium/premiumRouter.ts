import express from "express";
import mongo from "mongodb";

import { PureRouter } from "../general";
import {
  IAuthenticatedRequest,
  sendError,
  verifyPassword,
  verifyToken
} from "../utils";
import { isValidUpgrade } from "./premiumBodyChecker";
import { PremiumDatabase } from "./premiumDatabase";

export const PREMIUM_ROOT = "/premium";

class PurePremiumRouter extends PureRouter {
  private premium: PremiumDatabase;

  constructor(db: mongo.Db) {
    super();
    this.premium = new PremiumDatabase(db);
    this.mountPrivateRoutes();
  }

  private mountPrivateRoutes() {
    this.router.get("/check", verifyToken, this.handleCheckPremiumStatus);
    this.router.post("/upgrade", verifyPassword, this.handleUpgradeUser);
  }

  private handleCheckPremiumStatus = async (
    req: IAuthenticatedRequest,
    res: express.Response
  ) => {
    const payload = await this.premium.checkPremiumStatus(
      req.AUTHENTICATED_USER_ID
    );
    return res.json({
      message: "Attempted to check premium status",
      payload
    });
  };

  private handleUpgradeUser = async (
    req: express.Request,
    res: express.Response
  ) => {
    const errors = isValidUpgrade(req.body);
    if (errors.length > 0) {
      return sendError(res, errors);
    }
    const payload = await this.premium.upgradeUser(
      new mongo.ObjectId(req.body.userId),
      req.body.expiration
    );
    return res.json({
      message: "Attempted to upgrade user to premium",
      payload
    });
  };
}

export const PremiumRoutes = (db: mongo.Db) => new PurePremiumRouter(db).router;
