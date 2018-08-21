[![CircleCI](https://circleci.com/gh/kadhirvelm/atlasP-backend.svg?style=svg&circle-token=c02f66caa31e6a0e254e72a2c51c62d81696dbbb)](https://circleci.com/gh/kadhirvelm/atlasP-backend)

# AtlasP Backend

## Routes

### /users

    | REST | Route | Action | Implemented
    | ---- | ---- | -------- | ---- |
    | POST | /new | create a new user { User } | Yes |
    | POST | /getOne | fetches the user with { id: string }, returns `[]` if no user exists | Yes |
    | POST | /getMany | fetches the user with { ids: string[] }, returns `[]` if no user exists | Yes |
    | POST | /login/:id | checks if the has valid login credentials | No |
    | PUT | /update | updates existing user credentials with | No |
    | DELETE | /delete | deletes a user | No |

## Developing

### Run locally run

    -yarn
    -Turn on mongo (see turning on mongo below)
    -yarn dev
    -Head to: [localhost:3001](https://localhost:3001) to verify the server is up
    -Request to localhost:3001!

### Run mongo

    -Run production
    -Using kitematic or something similar, turn on just mongo
    -Be sure to set NODE_ENV (environment variable) to "development"
    -The app will be looking for mongo at 192.168.99.100:27017 (the default if running from kitematic)
    -This is located in [src/config/index.ts](https://github.com/kadhirvelm/atlasP-backend/blob/master/src/config/index.ts)

### Run prouduction

    -Turn on docker-machine
    -cd into root folder (/atlasP-backend/)
    -docker-compose build && docker-compose up