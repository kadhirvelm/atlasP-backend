"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const mongodb_1 = __importDefault(require("mongodb"));
const Users_1 = require("./routes/Users");
const config_1 = require("./config");
const VERSION = "0.1.0";
class PureApp {
    constructor() {
        this.app = express_1.default();
        this.app.use(body_parser_1.default.urlencoded({ extended: true }));
        this.mountDatabase();
        this.mountRoutes();
    }
    mountDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield mongodb_1.default.MongoClient.connect(config_1.MONGO_URL, { useNewUrlParser: true });
            this.database = client.db("atlasp");
        });
    }
    mountRoutes() {
        const router = express_1.default.Router();
        router.get("/", (req, res) => {
            res.json({
                message: `AtlasP Backend Running - V${process.env.npm_package_version}`,
            });
        });
        this.app.use("/", router);
        this.app.use("/users", Users_1.UsersRoutes);
    }
}
exports.App = new PureApp().app;
//# sourceMappingURL=App.js.map