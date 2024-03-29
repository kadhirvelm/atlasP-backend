FROM node:10

WORKDIR /usr/src/app

RUN touch ./.google_tokens

COPY package.json ./
COPY yarn.lock ./

RUN yarn remove mongodb-memory-server

RUN yarn

COPY . .

RUN yarn build

EXPOSE 3001

CMD ["yarn", "server"]