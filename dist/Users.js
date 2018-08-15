"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
/**
 * PATH ROOT: /users
 */
class PureUsers {
    constructor() {
        this.router = express_1.default.Router();
        this.mountRoutes();
    }
    mountRoutes() {
        this.router.get("/", (req, res) => {
            res.json({
                message: "No users found",
                payload: [],
            });
        });
    }
}
exports.UsersRoutes = new PureUsers().router;
//# sourceMappingURL=Users.js.map