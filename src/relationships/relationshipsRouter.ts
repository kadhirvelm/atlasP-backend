import express from "express";
import mongo from "mongodb";

import { PureRouter } from "../general";
import { IAuthenticatedRequest, sendError, verifyToken } from "../utils";
import { isValidRelationshipUpdate } from "./relationshipsBodyChecker";
import { RelationshipsDatabase } from "./relationshipsDatabase";

export const RELATIONSHIPS_ROOT = "/relationships";

class PureRelationshipRouter extends PureRouter {
  private relationships: RelationshipsDatabase;

  constructor(db: mongo.Db) {
    super();
    this.relationships = new RelationshipsDatabase(db);
    this.mountPrivateRoutes();
  }

  private mountPrivateRoutes() {
    this.router.get("/all", verifyToken, this.handleGetAllRelationships);
    this.router.post("/update", verifyToken, this.handleUpdateRelationships);
  }

  private handleGetAllRelationships = async (
    req: IAuthenticatedRequest,
    res: express.Response
  ) => {
    const payload = await this.relationships.getAllRelationships(
      req.AUTHENTICATED_USER_ID
    );
    return res.json({
      message: "Attempted to get all relationships.",
      payload
    });
  };

  private handleUpdateRelationships = async (
    req: IAuthenticatedRequest,
    res: express.Response
  ) => {
    const errorMessages = isValidRelationshipUpdate(
      req.body,
      req.AUTHENTICATED_USER_ID
    );
    if (errorMessages.length > 0) {
      return sendError(res, errorMessages);
    }
    const payload = await this.relationships.updateRelationships(
      req.AUTHENTICATED_USER_ID,
      req.body
    );
    return res.json({
      message: "Attempted to update relationships",
      payload
    });
  };
}

export const RelationshipRoutes = (db: mongo.Db) =>
  new PureRelationshipRouter(db).router;
