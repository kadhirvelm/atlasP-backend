import { App } from "./App";

const port = process.env.PORT || 3001;

App.listen(port, (error: any) => {
  if (error) {
    return console.error(error);
  }
});
