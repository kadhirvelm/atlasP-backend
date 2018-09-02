import mongo from "mongodb";

import { PureRouter } from "../general";
import { verifyToken } from "../utils";
import { GoogleDispatcher } from "./googleDispatcher";

export const GOOGLE_ROOT = "/google";

class PureGoogleRouter extends PureRouter {
    private googleClient: GoogleDispatcher;

    constructor(private database: mongo.Db) {
        super();
        this.googleClient = new GoogleDispatcher(database);
        this.mountRoutes();
    }

    private mountRoutes() {
        this.router.post("/write_to_sheets", verifyToken, async (req, res) => {
            const payload = await this.googleClient.fetchSheet();
            res.json({
                message: "Attempted to fetch sheet data.",
                payload,
            });
        });
    }
}

export const GoogleRoutes = (database: mongo.Db) => new PureGoogleRouter(database).router;
