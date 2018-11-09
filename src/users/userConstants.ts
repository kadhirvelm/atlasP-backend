import mongo from "mongodb";

export interface IUser {
  gender: "M" | "F" | "X";
  location: string;
  name: string;
  phoneNumber: string;
}

export interface IUserConnections {
  [id: string]: mongo.ObjectId[];
}
export interface IFullUser extends IUser {
  _id: mongo.ObjectId;
  claimed: boolean;
  connections?: IUserConnections;
  createdBy?: mongo.ObjectId;
  ignoreUsers?: mongo.ObjectId[];
  password: string;
  temporaryPassword: number;
}
export const validGenders = ["m", "f", "x"];
export const requiredUserKeys = [
  "gender",
  "location",
  "name",
  "password",
  "phoneNumber",
  "temporaryPassword",
];
export const USERS_COLLECTION = "USERS";
