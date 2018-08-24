import crypto from "crypto";
import express from "express";
import jwt from "jsonwebtoken";
import mongo from "mongodb";

const ONE_DAY = 60 * 60 * 24;
const TOKEN_EXPIRATION_TIME = ONE_DAY * 2;

export function hmacCheck(item: string) {
  return crypto
    .createHmac("sha256", process.env.NODE_SECRET)
    .update(item)
    .digest("hex");
}

export function hashPassword(password: string | undefined) {
  return crypto
    .createHash("sha256")
    .update(password || "")
    .digest("hex");
}

export function generateAuthenticationToken(userID: mongo.ObjectId) {
  return jwt.sign({ id: userID }, process.env.NODE_SECRET, {
    expiresIn: TOKEN_EXPIRATION_TIME,
  });
}

export function decodeAuthenticationToken(token: string) {
  try {
    return jwt.verify(token, process.env.NODE_SECRET);
  } catch (e) {
    return undefined;
  }
}

export function verifyToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const userID = decodeAuthenticationToken(req.headers["access-token"] as string);
  if (userID === undefined) {
    return res
      .status(401)
      .json({
        error: "Authentication token expired, incorrect, or not present.",
      });
  }
  req.body.AUTHENTICATED_USER = userID;
  return next();
}
