import bodyParser from "body-parser";
import express from "express";
import mongo from "mongodb";

import { MONGO_URL } from "./config";
import { EventRouters, EVENTS_ROOT } from "./events/eventsRouter";
import { GENERAL_ROOT, GeneralRoutes } from "./general/generalRouter";
import { GOOGLE_ROOT, GoogleRoutes } from "./google/googleRouter";
import { USERS_ROOT, UsersRoutes } from "./users/userRouter";

class PureApp {
    public app: express.Express;

    public database: mongo.Db;

    constructor() {
      this.app = express();
      this.app.use(bodyParser.json({ strict: true }));
      this.app.use((req, res, next) => {
        if (process.env.NODE_ENV === "development") {
          res.header("Access-Control-Allow-Origin", "*");
        } else {
          res.header("Access-Control-Allow-Origin", "http://54.153.122.67:3001");
        }
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, access-token");
        next();
      });

      this.mountDatabase();
    }

    private async mountDatabase() {
      const client = await mongo.MongoClient.connect(MONGO_URL, { useNewUrlParser: true });
      this.database = client.db("atlasp");
      this.mountRoutes();
    }

    private mountRoutes() {
      this.app.use(GENERAL_ROOT, GeneralRoutes);
      this.app.use(EVENTS_ROOT, EventRouters(this.database));
      this.app.use(USERS_ROOT, UsersRoutes(this.database));
      this.app.use(GOOGLE_ROOT, GoogleRoutes(this.database));
    }
}

export const App = new PureApp().app;
