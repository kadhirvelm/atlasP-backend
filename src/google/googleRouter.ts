import express from "express";
import mongo from "mongodb";

import { PureRouter } from "../general";
import { verifyToken } from "../utils";
import { GoogleDispatcher } from "./googleDispatcher";

export const GOOGLE_ROOT = "/google";

class PureGoogleRouter extends PureRouter {
  private googleClient: GoogleDispatcher;

  constructor(private database: mongo.Db) {
    super();
    this.googleClient = new GoogleDispatcher(database);
    this.mountRoutes();
  }

  private mountRoutes() {
    this.router.post(
      "/fetch_from_sheets",
      verifyToken,
      this.handleFetchFromSheets,
    );
    this.router.post("/write_to_sheets", verifyToken, this.handleWriteToSheets);
  }

  private handleFetchFromSheets = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      const payload = await this.googleClient.populateDatabase();
      res.json({
        message: "Attempted to fetch sheet data.",
        payload,
      });
    } catch (e) {
      this.handleError(res);
    }
  }

  private handleWriteToSheets = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      const payload = await this.googleClient.writeToSheets();
      res.json({
        message: "Attempted to write to sheets.",
        payload,
      });
    } catch (e) {
      this.handleError(res);
    }
  }

  private handleError = (res: express.Response) => {
    this.googleClient.authorize(true);
    res.json({
      error: "Refresh token",
      message: "Attempt to fetch sheet data failed.",
    });
  }
}

export const GoogleRoutes = (database: mongo.Db) => new PureGoogleRouter(database).router;
