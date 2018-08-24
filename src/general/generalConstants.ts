import express from "express";

export class PureRouter {
  public router: express.Router;

  constructor() {
    this.router = express.Router();
  }
}
