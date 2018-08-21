import express from "express";
import mongo from "mongodb";

import { PureRouter } from "../config/consts";
import { isValidUser, User } from "../users";
import { isString, isStringArray } from "../utils";

export const USERS_ROOT = "/users";

class PureUsersRouter extends PureRouter {
  private user: User;

  constructor(db: mongo.Db) {
    super();
    this.mountRoutes();
    this.user = new User(db);
  }

  private mountRoutes() {
    this.router.get("/", (req, res) => {
      res.json({
        message: "Valid routes: POST /new, POST /singleUser, POST /manyUsers",
        payload: [],
      });
    });
    this.router.post("/new", this.handleCreateNewUser);
    this.router.post("/getOne", this.handleGetSingleUser);
    this.router.post("/getMany", this.handleGetManyUsers);
  }

  private handleCreateNewUser = async (
    req: express.Request,
    res: express.Response,
  ) => {
    const errorMessages = isValidUser(req.body);
    if (errorMessages.length > 0) {
      this.sendError(res, errorMessages);
      return;
    }
    const message = await this.user.createNewUser(req.body as User);
    res.json({
      message,
      payload: [],
    });
  }

  private handleGetSingleUser = async (
    req: express.Request,
    res: express.Response,
  ) => {
    if (!isString(req.body.id)) {
      this.sendError(res, [`id is not a valid string: ${req.body.id}`]);
      return;
    }
    const payload = await this.user.getUser(req.body.id);
    res.json({
      message: "Successfully retrieved user.",
      payload,
    });
  }

  private handleGetManyUsers = async (
    req: express.Request,
    res: express.Response,
  ) => {
    if (!isStringArray(req.body.ids)) {
      this.sendError(res, [`ids is not an array of strings: ${req.body.ids}`]);
      return;
    }
    const payload = await this.user.getManyUsers(req.body.ids);
    res.json({
      message: "Successfully retrieved many user.",
      payload,
    });
  }

  private sendError = (res: express.Response, message: string[]) => {
    res.status(400).json({
      message,
      status: "Error, improperly formatted data",
    });
  }
}

export const UsersRoutes = (db: mongo.Db) => new PureUsersRouter(db).router;
