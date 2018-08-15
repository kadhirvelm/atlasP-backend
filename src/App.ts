import bodyParser from "body-parser";
import express from "express";
import mongo from "mongodb";

import { MONGO_URL } from "./config";
import { HomeRoutes, UsersRoutes } from "./routes";

class PureApp {
    public app: express.Express;

    public database: mongo.Db;

    constructor() {
      this.app = express();
      this.app.use(bodyParser.urlencoded({ extended: true }));

      this.mountDatabase();
      this.mountRoutes();
    }

    private async mountDatabase() {
      const client = await mongo.MongoClient.connect(MONGO_URL, { useNewUrlParser: true });
      this.database = client.db("atlasp");
    }

    private mountRoutes() {
      this.app.use("/", HomeRoutes);
      this.app.use("/users", UsersRoutes);
    }
}

export const App = new PureApp().app;
