import { PureRouter } from "../config/consts";

/**
 * PATH ROOT: /home
 */
class PureHome extends PureRouter {
  constructor() {
    super();
    this.mountRoutes();
  }

  private mountRoutes() {
    this.router.get("/", (req, res) => {
      res.json({
        message: `AtlasP Backend Running - V${process.env.npm_package_version}`,
      });
    });
  }
}

export const HomeRoutes = new PureHome().router;
