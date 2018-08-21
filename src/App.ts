import bodyParser from "body-parser";
import express from "express";
import mongo from "mongodb";

import { MONGO_URL } from "./config";
import { HomeRoutes, USERS_ROOT, UsersRoutes } from "./routes";

class PureApp {
    public app: express.Express;

    public database: mongo.Db;

    constructor() {
      this.app = express();
      this.app.use(bodyParser.json({ strict: true }));

      this.mountDatabase();
    }

    private async mountDatabase() {
      const client = await mongo.MongoClient.connect(MONGO_URL, { useNewUrlParser: true });
      this.database = client.db("atlasp");
      this.mountRoutes();
    }

    private mountRoutes() {
      this.app.use("/", HomeRoutes);
      this.app.use(USERS_ROOT, UsersRoutes(this.database));
    }
}

export const App = new PureApp().app;
