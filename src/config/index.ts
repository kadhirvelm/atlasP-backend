export let MONGO_URL: string;

if (process.env.NODE_ENV === "development") {
    MONGO_URL = "mongodb://192.168.99.100:27017";
} else {
    MONGO_URL = "mongodb://mongodb:27017/atlasp";
}
