import mongo from "mongodb";

export interface IUser {
  age: number;
  gender: "M" | "F" | "X";
  location: string;
  name: string;
  phoneNumber: string;
}

export interface IUserConnections { [id: string]: mongo.ObjectId[]; }
export interface IFullUser extends IUser {
  _id: mongo.ObjectId;
  claimed: boolean;
  temporaryPassword: number;
  password: string;
  connections?: IUserConnections;
}
export const validGenders = ["m", "f", "x"];
export const validUserKeys = [
  "age",
  "gender",
  "location",
  "name",
  "password",
  "phoneNumber",
  "temporaryPassword",
];
export const USERS_COLLECTION = "USERS";
