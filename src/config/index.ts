export const MONGO_URL = process.env.NODE_ENV === "development"
  ? "mongodb://192.168.99.100:27017"
  : "mongodb://mongodb:27017/atlasp";
