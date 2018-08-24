[![CircleCI](https://circleci.com/gh/kadhirvelm/atlasP-backend.svg?style=svg&circle-token=c02f66caa31e6a0e254e72a2c51c62d81696dbbb)](https://circleci.com/gh/kadhirvelm/atlasP-backend)

# AtlasP Backend

## Routes

### /users

| REST | Route | Action | Implemented |
| ---- | ---- | -------- | ---- |
| POST | /new | create a new user { User } | Yes |
| POST | /getOne | fetches the user with { id: string }, returns `[]` if no user exists | Yes |
| POST | /getMany | fetches the user with { ids: string[] }, returns `[]` if no user exists | Yes |
| POST | /claim | claims a user account, giving it a phone number | Yes |
| POST | /login | checks if the user has valid login credentials | Yes |
| PUT | /update | updates existing user credentials with | Yes |

## Contribution

### RDD

We implement readme driven development, meaning before you make feature changes to the API, make sure to record what exactly
you're trying to implement here in the README, specifically in the routes section. If you're refactoring, making infrastructure
changes, etc, no need to include anything here in the README, just make a descriptive PR message.

### Importing

```typescript
import external from "modules";

import local from "internal_files";

import everything_else from "internal_files";
```

The goal here is to standardize importing.

In additiona, use `index.ts` files in each sub-folder, exporting all contents that can be accessed by
other files. This is to avoid super specific sub-module importing and to prevent future routes from importing
module specific files. In other words, if `import file from "../module_folder"` doesn't work, it probably
means you shouldn't be importing that file.

## Developing

### Run locally run

1. yarn
2. Turn on mongo (see turning on mongo below)
3. yarn dev
4. Head to: [localhost:3001](https://localhost:3001) to verify the server is up
5. Send REST requests to localhost:3001

### Run mongo

1. Run production instructions with kitematic
2. Turn mongo on specifically
3. Set local NODE_ENV (environment variable) to "development"
4. The app will be looking for mongo at 192.168.99.100:27017 (the default if running from kitematic)
5. This is located in [src/config/index.ts](https://github.com/kadhirvelm/atlasP-backend/blob/master/src/config/index.ts)

### Run prouduction

1. Turn on docker-machine (or kitematic docker CLI)
2. cd into root folder from exec (REPO/atlasP-backend/)
3. docker-compose build && docker-compose up