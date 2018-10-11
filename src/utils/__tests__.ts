import { assert, expect } from "chai";
import express from "express";
import request from "supertest";

export const DEFAULT_MONGOID = "000000000000";
export const MONGO_ID_1 = "100000000000";
export const MONGO_ID_2 = "200000000000";
export const MONGO_ID_3 = "300000000000";
export const MONGO_ID_4 = "400000000000";
export const MONGO_ID_5 = "500000000000";
export const MONGO_ID_6 = "600000000000";

export async function createUsers(application: express.Router, ...users: string[]): Promise<string[]> {
    const userIDs = [];
    for (const name of users) {
        const response = await request(application)
        .post("/users/new")
        .send({
            age: 0,
            gender: "X",
            location: "Node",
            name,
            phoneNumber: "0000000000",
        });
        userIDs.push(response.body.payload._id);
        delete response.body.payload._id;
        assert.deepEqual(response.body.payload, { newUser: { n: 1, ok: 1 } });
    }
    expect(userIDs).to.have.lengthOf(users.length);
    return userIDs;
}
