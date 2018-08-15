import bodyParser from "body-parser";
import express from "express";
import mongo from "mongodb";

import { UsersRoutes } from "./routes/Users";
import { MONGO_URL } from "./config";

const VERSION = "0.1.0";

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
      const router = express.Router();

      router.get("/", (req, res) => {
        res.json({
          message: `AtlasP Backend Running - V${process.env.npm_package_version}`,
        });
      });

      this.app.use("/", router);
      this.app.use("/users", UsersRoutes);
    }
}

export const App = new PureApp().app;
