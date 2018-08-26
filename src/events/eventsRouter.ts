import express from "express";
import mongo from "mongodb";

import { EventDatabase } from "./eventsDatabase";

import { PureRouter } from "../general";
import { IAuthenticatedRequest, verifyToken } from "../utils";

export const EVENTS_ROOT = "/events";

class PureEventsRouter extends PureRouter {
  private events: EventDatabase;

  constructor(db: mongo.Db) {
    super();
    this.events = new EventDatabase(db);
    this.mountAuthenticatedRoutes();
  }

  private mountAuthenticatedRoutes() {
    this.router.post("/new", verifyToken, this.handleCreateEvent);
  }

  private handleCreateEvent = (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
      return res.json({
          message: "Attempted to create new event",
          payload: { error: "Not implemented yet." },
      });
  }
}

export const EventRouters = (db: mongo.Db) => new PureEventsRouter(db).router;
