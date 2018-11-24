import express from "express";
import mongo from "mongodb";

import { PureRouter } from "../general";
import { IAuthenticatedRequest, verifyToken } from "../utils";
import { RecommendationDatabase } from "./recommendationDatabase";

export const RECOMMENDATIONS_ROOT = "/recommendations";

class PureRecommendationRouter extends PureRouter {
  private recommendations: RecommendationDatabase;

  constructor(db: mongo.Db) {
    super();
    this.recommendations = new RecommendationDatabase(db);
    this.mountPrivateRoutes();
  }

  private mountPrivateRoutes() {
    this.router.get(
      "/read",
      verifyToken,
      this.handleReadShouldDisplayRecommendation
    );
    this.router.get(
      "/write",
      verifyToken,
      this.handleWriteHasSeenRecommendation
    );
  }

  private handleReadShouldDisplayRecommendation = async (
    req: IAuthenticatedRequest,
    res: express.Response
  ) => {
    const payload = await this.recommendations.shouldDisplayRecommendationDialog(
      req.AUTHENTICATED_USER_ID
    );
    return res.json({
      message: "Attempted to read should display recommendation dialog.",
      payload
    });
  };

  private handleWriteHasSeenRecommendation = async (
    req: IAuthenticatedRequest,
    res: express.Response
  ) => {
    const payload = await this.recommendations.writeLastUserSeenRecommendation(
      req.AUTHENTICATED_USER_ID
    );
    return res.json({
      message: "Attempted to write should display recommendation.",
      payload
    });
  };
}

export const RecommendationRouter = (db: mongo.Db) =>
  new PureRecommendationRouter(db).router;
