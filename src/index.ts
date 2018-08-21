import { App } from "./App";

const port = process.env.PORT || 3001;

App.listen(port, (error: any) => {
  if (error) {
    // tslint:disable-next-line:no-console
    console.error(error);
  }
  // tslint:disable-next-line:no-console
  console.log(`Server running at https://localhost:${port}`);
});
