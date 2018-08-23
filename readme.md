[![CircleCI](https://circleci.com/gh/kadhirvelm/atlasP-backend.svg?style=svg&circle-token=c02f66caa31e6a0e254e72a2c51c62d81696dbbb)](https://circleci.com/gh/kadhirvelm/atlasP-backend)

# AtlasP Backend

## Routes

### /users

| REST | Route | Action | Implemented
| ---- | ---- | -------- | ---- |
| POST | /new | create a new user { User } | Yes |
| POST | /getOne | fetches the user with { id: string }, returns `[]` if no user exists | Yes |
| POST | /getMany | fetches the user with { ids: string[] }, returns `[]` if no user exists | Yes |
| POST | /claim | claims a user account, giving it credentials | No |
| POST | /login | checks if the has valid login credentials | No |
| PUT | /update | updates existing user credentials with | No |
| DELETE | /delete | deletes a user | No |


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
