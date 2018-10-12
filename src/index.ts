import { App } from "./App";
import { MONGO_URL } from "./config";

const port = process.env.PORT || 3001;

App(MONGO_URL).listen(port, (error: any) => {
  if (error) {
    // tslint:disable-next-line:no-console
    console.error(error);
  }
  // tslint:disable-next-line:no-console
  console.log(`Server running at https://localhost:${port}`);
});
