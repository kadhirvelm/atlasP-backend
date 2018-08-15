import express from "express";

/**
 * PATH ROOT: /users
 */
class PureUsers {
    public router: express.Router;

    constructor() {
        this.router = express.Router();
        this.mountRoutes();
    }

    private mountRoutes() {
        this.router.get("/", (req, res) => {
            res.json({
                message: "No users found",
                payload: [],
            });
        });
    }
}

export const UsersRoutes = new PureUsers().router;
