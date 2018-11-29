[![CircleCI](https://circleci.com/gh/kadhirvelm/atlasP-backend.svg?style=svg&circle-token=c02f66caa31e6a0e254e72a2c51c62d81696dbbb)](https://circleci.com/gh/kadhirvelm/atlasP-backend)

# AtlasP Backend

## Routes

### /users

| REST | Route              | Action                                                                                  | Implemented |
| ---- | ------------------ | --------------------------------------------------------------------------------------- | ----------- |
| POST | /new               | create a new user { User }                                                              | Yes         |
| POST | /new-user          | fetches a single user, optionally not fully sanitizing if the token matches the request | Yes         |
| POST | /getOne            | fetches the user with { id: string }, returns `[]` if no user exists                    | Yes         |
| POST | /getMany           | fetches the user with { ids: string[] }, returns `[]` if no user exists                 | Yes         |
| POST | /claim             | claims a user account, giving it a phone number                                         | Yes         |
| POST | /login             | checks if the user has valid login credentials                                          | Yes         |
| PUT  | /update            | updates existing user credentials with                                                  | Yes         |
| PUT  | /update-other      | updates another user provided that user has not claimed their account                   | Yes         |
| POST | /add-connection    | adds another user to your graph using their phone number                                | Yes         |
| POST | /remove-connection | removes an existing connection provided the user has no events with them                | Yes         |
| POST | /reset             | resets a user's claimed status to false using their phone number                        | Yes         |

### /account

| REST | Route    | Action                                                       | Implemented |
| ---- | -------- | ------------------------------------------------------------ | ----------- |
| GET  | /check   | returns the current authenticated user's account status      | Yes         |
| POST | /upgrade | allows an admin user to increase a user's account expiration | Yes         |

### /relationships

| REST | Route   | Action                               | Implemented |
| ---- | ------- | ------------------------------------ | ----------- |
| GET  | /all    | returns all relationships a user has | Yes         |
| POST | /update | updates a user's relationships       | Yes         |

### /events

| REST   | Route    | Action                                                       | Implemented |
| ------ | -------- | ------------------------------------------------------------ | ----------- |
| POST   | /new     | create a new event { Event }                                 | Yes         |
| POST   | /update  | updates an existing event given { eventId: string, ...body } | Yes         |
| POST   | /getOne  | fetches a single event { eventId: string }                   | Yes         |
| POST   | /getMany | gets many events { eventIds: string[] }                      | Yes         |
| DELETE | /delete  | deletes an event with { eventId: string }                    | Yes         |
| GET    | /reindex | reindexes all users and event connections                    | Yes         |

### /google

| REST | Route              | Action                                                                                   | Implemented |
| ---- | ------------------ | ---------------------------------------------------------------------------------------- | ----------- |
| POST | /new_token         | writes a new google token                                                                | Yes         |
| POST | /fetch_from_sheets | appends google sheet data to the database, mostly useful for initially populating the db | Yes         |
| POST | /write_to_sheets   | writes USERS and EVENTS to google sheets                                                 | Yes         |

### /recommendations

| REST | Route  | Action                                                          | Implemented |
| ---- | ------ | --------------------------------------------------------------- | ----------- |
| GET  | /read  | reads if the user was recommended someone they haven't seen yet | Yes         |
| GET  | /write | writes if they've seen the recommendation                       | Yes         |

### /reports

| REST | Route     | Action                                                   | Implemented |
| ---- | --------- | -------------------------------------------------------- | ----------- |
| GET  | /generate | creates a new report and send it to the recipient emails | Yes         |

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

### Run production

1. Turn on docker-machine (or kitematic docker CLI)
2. cd into root folder from exec (REPO/atlasP-backend/)
3. docker-compose build && docker-compose up
