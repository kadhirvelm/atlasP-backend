import express from "express";
import mongo from "mongodb";

import { IRawEvent } from "./eventsConstants";
import { EventDatabase } from "./eventsDatabase";

import { PureRouter } from "../general";
import { IAuthenticatedRequest, sendError, verifyToken } from "../utils";
import { isValidEvent } from "./eventBodyChecker";

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

  private handleCreateEvent = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    const errorMessages = isValidEvent(req.body);
    if (errorMessages.length > 0) {
      return sendError(res, errorMessages);
    }
    const payload = await this.events.createNewEvent(req.body as IRawEvent);
    return res.json({
        message: "Attempted to create new event",
        payload,
    });
  }
}

export const EventRouters = (db: mongo.Db) => new PureEventsRouter(db).router;
