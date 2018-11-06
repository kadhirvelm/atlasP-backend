import express from "express";
import mongo from "mongodb";

import {
  isValidLogin,
  isValidRemoval,
  isValidUser,
  isValidUserUpdate,
} from "./userBodyChecker";
import { IUser } from "./userConstants";
import { UserDatabase } from "./usersDatabase";

import { PureRouter } from "../general";
import {
  getStatus,
  IAuthenticatedRequest,
  isValidMongoID,
  isValidMongoIDArray,
  isValidPhoneNumber,
  sendError,
  verifyToken,
} from "../utils";

export const USERS_ROOT = "/users";

class PureUsersRouter extends PureRouter {
  private user: UserDatabase;

  constructor(db: mongo.Db) {
    super();
    this.user = new UserDatabase(db);
    this.mountPublicRoutes();
    this.mountAuthenticatedRoutes();
  }

  /**
   * Public routes
   */

  private mountPublicRoutes() {
    this.router.post("/new", this.handleCreateNewUser);
    this.router.post("/claim", this.handleClaimUser);
    this.router.post("/login", this.handleLoginUser);
  }

  private handleCreateNewUser = async (
    req: express.Request,
    res: express.Response,
  ) => {
    const errorMessages = isValidUser(req.body);
    if (errorMessages.length > 0) {
      return sendError(res, errorMessages);
    }
    const payload = await this.user.createNewUser(req.body as IUser);
    return res.json({
      message: "Attempted new user creation.",
      payload,
    });
  }

  private handleClaimUser = async (
    req: express.Request,
    res: express.Response,
  ) => {
    if (!isValidPhoneNumber(req.body.phoneNumber)) {
      return sendError(res, [`Invalid phone number: ${req.body.phoneNumber}`]);
    }
    const payload = await this.user.claim(req.body.phoneNumber);
    return res.status(getStatus(payload)).json({
      message: "Attempted claim.",
      payload,
    });
  }

  private handleLoginUser = async (
    req: express.Request,
    res: express.Response,
  ) => {
    if (!isValidLogin(req.body)) {
      return sendError(res, ["Invalid credentials", req.body]);
    }
    const payload = await this.user.login(
      req.body.phoneNumber,
      req.body.password,
      req.body.temporaryPassword,
    );
    return res.status(getStatus(payload)).json({
      message: "Attempted login.",
      payload,
    });
  }

  /**
   * Authenticated Routes
   */

  private mountAuthenticatedRoutes() {
    this.router.post("/new-user", verifyToken, this.handleUserCreatingNewUser);
    this.router.post("/getOne", verifyToken, this.handleGetSingleUser);
    this.router.post("/getMany", verifyToken, this.handleGetManyUsers);
    this.router.post("/update", verifyToken, this.handleUpdateUser);
    this.router.post("/remove-connection", verifyToken, this.handleRemoveConnection);
  }

  private handleUserCreatingNewUser = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    const errorMessages = isValidUser(req.body);
    if (errorMessages.length > 0) {
      return sendError(res, errorMessages);
    }
    const newUser = await this.user.createNewUser(
      req.body as IUser,
      req.AUTHENTICATED_USER_ID,
    );
    await this.user.indexUserEvents([newUser._id, req.AUTHENTICATED_USER_ID]);
    return res.json({
      message: "Attempted to create a new user.",
      payload: { newUserId: newUser._id },
    });
  }

  private handleGetSingleUser = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    if (!isValidMongoID(req.body.id)) {
      return sendError(res, [`id is not a valid string: ${req.body.id}`]);
    }
    const payload = await this.user.getUser(
      req.body.id,
      !(req.body.id === req.AUTHENTICATED_USER_ID.toHexString()),
    );
    return res.json({
      message: "Attempted single user retrieval.",
      payload,
    });
  }

  private handleGetManyUsers = async (
    req: express.Request,
    res: express.Response,
  ) => {
    if (!isValidMongoIDArray(req.body.ids)) {
      return sendError(res, [
        `ids is not an array of strings: ${req.body.ids}`,
      ]);
    }
    const payload = await this.user.getManyUsers(req.body.ids);
    return res.json({
      message: "Attempted many user retrieval.",
      payload,
    });
  }

  private handleUpdateUser = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    const errorMessages = isValidUserUpdate(req.body);
    if (errorMessages.length > 0) {
      return sendError(res, errorMessages);
    }
    const payload = await this.user.updateUser(
      req.AUTHENTICATED_USER_ID,
      req.body,
    );
    return res.json({
      message: "Attempted to update user.",
      payload,
    });
  }

  private handleRemoveConnection = async (
    req: IAuthenticatedRequest,
    res: express.Response,
  ) => {
    if (!isValidRemoval(req.body)) {
      return sendError(res, ["Invalid removal ID"]);
    }
    try {
      const payload = await this.user.removeConnectionFromGraph(
        req.AUTHENTICATED_USER_ID,
        req.body.removeConnection,
      );
      return res.json({
        message: "Attempted to remove connection from user.",
        payload,
      });
    } catch {
      return sendError(res, ["We can only remove someone who has not attended any events with you."]);
    }
  }
}

export const UsersRoutes = (db: mongo.Db) => new PureUsersRouter(db).router;
