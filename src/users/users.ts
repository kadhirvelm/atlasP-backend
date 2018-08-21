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
export const COLLECTION_NAME = "USERS";
export interface IUser {
  age: number;
  gender: "M" | "F" | "X";
  location: string;
  name: string;
  phoneNumber: string;
}

export class User {
  constructor(private db: mongo.Db) {}

  public createNewUser(user: User) {
    return handleError(async () => {
      const newUser = await this.db.collection(COLLECTION_NAME).insertOne(user);
      return newUser;
    });
  }

  public async getUser(id: string) {
    return this.getManyUsers([id]);
  }

  public async getManyUsers(ids: string[]) {
    return handleError(async () => {
      const allUsers = await this.db
        .collection(COLLECTION_NAME)
        .find({ _id: { $in: ids.map((id) => new mongo.ObjectId(id)) } })
        .sort({ name: 1 });
      return allUsers.toArray();
    });
  }
}
