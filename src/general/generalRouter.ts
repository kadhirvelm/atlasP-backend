import { PureRouter } from "./generalConstants";

export const GENERAL_ROOT = "/";

class PureGeneralRouter extends PureRouter {
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

export const GeneralRoutes = new PureGeneralRouter().router;
