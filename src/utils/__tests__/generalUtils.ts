import { expect } from "chai";
import MongodbMemoryServer, { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import { PureApp } from "../../App";

export enum IRequestTypes {
    DELETE = "DELETE",
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
}

export class MongoMock {
    public mongodb: MongoMemoryServer;
    public application: PureApp;
    public authenticationToken: string;

    public constructor() {
        this.mongodb = new MongodbMemoryServer();
    }

    public async mountDatabase() {
        const mongoURL = await this.mongodb.getConnectionString();
        this.application = new PureApp(mongoURL);
        /** HACKHACK: let's the database mount before executing the tests. */
        timeout(200);
    }

    public setAuthenticationToken(token: string) {
        this.authenticationToken = token;
    }

    public sendRequest(requestType: IRequestTypes, path: string, body: any, overrideAuthToken?: string | undefined) {
        switch (requestType) {
            case IRequestTypes.DELETE:
                return request(this.application.app).delete(path).set("access-token", overrideAuthToken || this.authenticationToken).send(body);
            case IRequestTypes.GET:
                return request(this.application.app).get(path).set("access-token", overrideAuthToken || this.authenticationToken).send(body);
            case IRequestTypes.POST:
                return request(this.application.app).post(path).set("access-token", overrideAuthToken || this.authenticationToken).send(body);
            case IRequestTypes.PUT:
                return request(this.application.app).put(path).set("access-token", overrideAuthToken || this.authenticationToken).send(body);
        }
    }

    public async close() {
        return this.mongodb.stop();
    }

    public async createUsers(...users: string[]): Promise<string[]> {
        const userIDs = [];
        for (const name of users) {
            const response = await this.sendRequest(IRequestTypes.POST, "/users/new", {
                age: 0,
                gender: "X",
                location: "Node",
                name,
                phoneNumber: "8004444444",
            });
            userIDs.push(response.body.payload._id);
            delete response.body.payload._id;
        }
        expect(userIDs).to.have.lengthOf(users.length);
        return userIDs;
    }
}

export function timeout(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
