import express from "express";
import mongo from "mongodb";

import { IRawEvent } from "./eventsConstants";
import { EventDatabase } from "./eventsDatabase";

import { PureRouter } from "../general";
import {
  IAuthenticatedRequest,
  isValidMongoID,
  isValidMongoIDArray,
  sendError,
  verifyToken,
} from "../utils";
import { isValidEvent, isValidEventUpdate } from "./eventBodyChecker";

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
    this.router.put("/update", verifyToken, this.handleUpdateEvent);
    this.router.post("/getOne", verifyToken, this.handleGetOneEvent);
    this.router.post("/getMany", verifyToken, this.handleGetManyEvents);
    this.router.post("/reindex", verifyToken, this.handleReindex);
  }

  private handleCreateEvent = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    const errorMessages = isValidEvent(req.body, req.AUTHENTICATED_USER_ID);
    if (errorMessages.length > 0) {
      return sendError(res, errorMessages);
    }
    const payload = await this.events.createNewEvent(req.body as IRawEvent);
    return res.json({
      message: "Attempted to create new event",
      payload,
    });
  }

  private handleUpdateEvent = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    const errorMessages = isValidEventUpdate(
      req.body,
      req.AUTHENTICATED_USER_ID,
    );
    if (errorMessages.length > 0) {
      return sendError(res, errorMessages);
    }
    const payload = await this.events.updateEvent(
      new mongo.ObjectId(req.body.eventId),
      req.body as IRawEvent,
    );
    return res.json({
      message: "Attempted to update event",
      payload,
    });
  }

  private handleGetOneEvent = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    if (!isValidMongoID(req.body.eventId)) {
      return sendError(res, [`Invalid event ID: ${req.body.eventId}`]);
    }
    const payload = await this.events.getOneEvent(req.body.eventId);
    return res.json({
      message: "Attempted to get one event",
      payload,
    });
  }

  private handleGetManyEvents = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    if (!isValidMongoIDArray(req.body.eventIds)) {
      return sendError(res, [`Invalid event IDs: ${req.body.eventIds}`]);
    }
    const payload = await this.events.getManyEvents(req.body.eventIds);
    return res.json({
      message: "Attempted to get many events",
      payload,
    });
  }

  private handleReindex = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    const payload = await this.events.reindexAllEvents();
    return res.json({
      message: "Attempted full reindex of all events and users",
      payload,
    });
  }
}

export const EventRouters = (db: mongo.Db) => new PureEventsRouter(db).router;
