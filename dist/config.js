"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (process.env.NODE_ENV === "development") {
    exports.MONGO_URL = "mongodb://192.168.99.100:27017";
}
else {
    exports.MONGO_URL = "mongodb://mongodb:27017/atlasp";
}
//# sourceMappingURL=config.js.map