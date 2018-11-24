import express from "express";
import mongo from "mongodb";

import { PureRouter } from "../general";
import {
  IAuthenticatedRequest,
  sendError,
  verifyPassword,
  verifyToken
} from "../utils";
import { isValidUpgrade } from "./accountBodyChecker";
import { AccountDatabase } from "./accountDatabase";

export const ACCOUNT_ROOT = "/account";

class PureAccountRouter extends PureRouter {
  private account: AccountDatabase;

  constructor(db: mongo.Db) {
    super();
    this.account = new AccountDatabase(db);
    this.mountPrivateRoutes();
  }

  private mountPrivateRoutes() {
    this.router.get("/check", verifyToken, this.handleCheckAccountStatus);
    this.router.post("/upgrade", verifyPassword, this.handleUpgradeUser);
  }

  private handleCheckAccountStatus = async (
    req: IAuthenticatedRequest,
    res: express.Response
  ) => {
    const payload = await this.account.checkAccountStatus(
      req.AUTHENTICATED_USER_ID
    );
    return res.json({
      message: "Attempted to check account status",
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
    const payload = await this.account.upgradeUser(
      new mongo.ObjectId(req.body.userId),
      req.body.expiration
    );
    return res.json({
      message: "Attempted to upgrade user to account",
      payload
    });
  };
}

export const AccountRoutes = (db: mongo.Db) => new PureAccountRouter(db).router;
