"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const App_1 = require("./App");
const port = process.env.PORT || 3001;
App_1.App.listen(port, (error) => {
    if (error) {
        return console.error(error);
    }
});
//# sourceMappingURL=index.js.map