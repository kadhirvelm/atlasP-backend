import mongo from "mongodb";

import { handleError } from "../utils";

export const validGenders = ["m", "f", "x"];
export const validUserKeys = [
  "age",
  "gender",
  "location",
  "name",
  "phoneNumber",
];
export const USERS_COLLECTION = "USERS";
export interface IUser {
  age: number;
  gender: "M" | "F" | "X";
  location: string;
  name: string;
  phoneNumber: string;
}
export interface IFullUser extends IUser {
  _id: mongo.ObjectId;
  claimed: boolean;
  temporaryPassword: number;
  password: string;
}

export class User {
  constructor(private db: mongo.Db) {}

  public createNewUser(user: User) {
    return handleError(async () => {
      const newUser = await this.db.collection(USERS_COLLECTION).insertOne(user);
      return newUser;
    });
  }

  public async getUser(id: string) {
    return this.getManyUsers([id]);
  }

  public async getManyUsers(ids: string[]) {
    return handleError(async () => {
      const allUsers = await this.db
        .collection(USERS_COLLECTION)
        .find({ _id: { $in: ids.map((id) => new mongo.ObjectId(id)) } })
        .sort({ name: 1 });
      return allUsers.toArray();
    });
  }

  public async claim(phoneNumber: string) {
    const fetchUser = await this.db.collection(USERS_COLLECTION).find({ phoneNumber });
    const user: IFullUser = await fetchUser.next();
    if (user == null || user.claimed) {
      return { error: "Phone number is not in the database or user has already been claimed." };
    }
    const updatedUser = { ...user, claimed: true, temporaryPassword: Math.round(1000 + Math.random() * 9999) };
    await this.db.collection(USERS_COLLECTION).update({ _id: user._id }, updatedUser);
    return { temporaryPassword: updatedUser.temporaryPassword };
  }
}
