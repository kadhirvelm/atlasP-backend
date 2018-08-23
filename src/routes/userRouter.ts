import express from "express";
import mongo from "mongodb";

import { PureRouter } from "../config/consts";
import {
  isValidLogin, isValidUser, IUser, User,
} from "../users";
import { isString, isStringArray, isValidPhoneNumber } from "../utils";

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

    this.router.post("/claim", this.handleClaimUser);
    this.router.post("/login", this.handleLoginUser);
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
    const payload = await this.user.createNewUser(req.body as IUser);
    res.json({
      message: "Attempted new user creation.",
      payload,
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
      message: "Attempted single user retrieval.",
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
      message: "Attempted many user retrieval.",
      payload,
    });
  }

  private handleClaimUser = async (
    req: express.Request,
    res: express.Response,
  ) => {
    if (!isValidPhoneNumber(req.body.phoneNumber)) {
      this.sendError(res, [`Invalid phone number: ${req.body.phoneNumber}`]);
      return;
    }
    const payload = await this.user.claim(req.body.phoneNumber);
    res.json({
      message: "Attempted claim.",
      payload,
    });
  }

  private handleLoginUser = async (
    req: express.Request,
    res: express.Response,
  ) => {
    if (!isValidLogin(req.body)) {
      this.sendError(res, ["Invalid credentials", req.body]);
      return;
    }
    const payload = await this.user.login(
      req.body.phoneNumber,
      req.body.password,
      req.body.temporaryPassword,
    );
    res.json({
      message: "Attempted login.",
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
