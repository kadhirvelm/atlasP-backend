import bodyParser from "body-parser";
import express from "express";
import mongo from "mongodb";

import { EventRouters, EVENTS_ROOT } from "./events/eventsRouter";
import { GENERAL_ROOT, GeneralRoutes } from "./general/generalRouter";
import { GOOGLE_ROOT, GoogleRoutes } from "./google/googleRouter";
import { REPORT_ROOT, ReporterRoutes } from "./reports/reporter";
import { USERS_ROOT, UsersRoutes } from "./users/userRouter";

export class PureApp {
    public app: express.Express;

    public database: mongo.Db;

    constructor(mongoUrl: string) {
      this.app = express();
      this.app.use(bodyParser.json({ strict: true }));
      this.app.use((req, res, next) => {
        if (process.env.NODE_ENV === "development") {
          res.header("Access-Control-Allow-Origin", "*");
        } else {
          res.header("Access-Control-Allow-Origin", "http://www.atlas-people.com");
        }
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, access-token");
        res.header("Access-Control-Allow-Methods", "DELETE, GET, POST, PUT");
        next();
      });

      this.mountDatabase(mongoUrl);
    }

    private async mountDatabase(mongoUrl: string) {
      const client = await mongo.MongoClient.connect(mongoUrl, { useNewUrlParser: true });
      this.database = client.db("atlasp");
      this.mountRoutes();
    }

    private mountRoutes() {
      this.app.use(GENERAL_ROOT, GeneralRoutes);
      this.app.use(EVENTS_ROOT, EventRouters(this.database));
      this.app.use(USERS_ROOT, UsersRoutes(this.database));
      this.app.use(GOOGLE_ROOT, GoogleRoutes(this.database));
      this.app.use(REPORT_ROOT, ReporterRoutes(this.database));
    }
}

export const App = (mongoUrl: string) => new PureApp(mongoUrl).app;
