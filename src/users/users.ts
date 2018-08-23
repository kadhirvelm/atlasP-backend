import mongo from "mongodb";

import { handleError } from "../utils";
import { hashPassword, sanitizePhoneNumber } from "../utils/general";

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

  public createNewUser(user: IUser) {
    return handleError(async () => {
      const finalUser = { ...user, phoneNumber: sanitizePhoneNumber(user.phoneNumber) };
      const newUser = await this.db.collection(USERS_COLLECTION).insertOne(finalUser);
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
    const user = await this.retrieveUser(phoneNumber);
    if (user == null || user.claimed) {
      return { error: "Phone number is not in the database or user has already been claimed." };
    }
    const updatedUser = {
      ...user,
      claimed: true,
      temporaryPassword: Math.round(1000 + Math.random() * 9999),
    };
    await this.db.collection(USERS_COLLECTION).updateOne({ _id: user._id }, updatedUser);
    return { temporaryPassword: updatedUser.temporaryPassword };
  }

  public async login(phoneNumber: string, password: string, temporaryPassword?: number) {
    const user = await this.retrieveUser(phoneNumber);
    if (user == null && temporaryPassword !== user.temporaryPassword && hashPassword(password) !== user.password) {
      return { error: "Either user doesn't exist, or password is incorrect." };
    }
    delete user.password;
    delete user.temporaryPassword;
    return user;
  }

  private async retrieveUser(phoneNumber: string): Promise<IFullUser | null> {
    const fetchUser = await this.db.collection(USERS_COLLECTION).find({
      phoneNumber: sanitizePhoneNumber(phoneNumber),
    });
    return await fetchUser.next();
  }
}
