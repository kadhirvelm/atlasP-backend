import { PureRouter } from "../config/consts";

/**
 * PATH ROOT: /users
 */
class PureUsers extends PureRouter {
  constructor() {
    super();
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
