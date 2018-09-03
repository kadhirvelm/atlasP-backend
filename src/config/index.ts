export const MONGO_URL = process.env.NODE_ENV === "development"
  ? "mongodb://localhost:27017/atlasp"
  : "mongodb://mongodb:27017/atlasp";
