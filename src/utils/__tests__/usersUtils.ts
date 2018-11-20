import mongo from "mongodb";

export const DEFAULT_MONGOID = "000000000000";
export const MONGO_ID_1 = "100000000000";
export const MONGO_ID_2 = "200000000000";
export const MONGO_ID_3 = "300000000000";
export const MONGO_ID_4 = "400000000000";
export const MONGO_ID_5 = "500000000000";
export const MONGO_ID_6 = "600000000000";

export const convertToMongoObjectId = (id: string) => new mongo.ObjectId(id);

export const FAKE_PHONE_NUMBERS = [
  "2025550170",
  "2025550158",
  "2025550123",
  "2025550191"
];
