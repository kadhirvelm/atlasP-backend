import express from "express";
import mongo from "mongodb";

import { IFullUser } from "../users";

import { generateAuthenticationToken } from "./security";

const ADMINS: string[] = [];

export function sendError(res?: express.Response, message?: string[]) {
  const errorMessage = {
    message,
    status: "Error, improperly formatted data",
  };
  if (res !== undefined) {
    res.status(400).json(errorMessage);
  }
  return errorMessage;
}

export function sanitizePhoneNumber(phoneNumber: string | undefined) {
  if (phoneNumber === undefined) {
    return null;
  }
  return phoneNumber.slice().replace(/![0-9]/g, "");
}

export function sanitizeUser(
  user: IFullUser,
  shouldGenerateToken: boolean = true,
) {
  const finalUser = { ...user };
  delete finalUser.password;
  delete finalUser.temporaryPassword;
  const authenticationToken = shouldGenerateToken && generateAuthenticationToken(user._id);
  return {
    token: authenticationToken,
    userDetails: finalUser,
  };
}

export function fullSanitizeUser(user: IFullUser) {
  const finalSanitization = sanitizeUser(user, false);
  delete finalSanitization.userDetails.connections;
  delete finalSanitization.userDetails.claimed;
  return finalSanitization.userDetails;
}

export function parseIntoObjectIDs(ids: string[]): mongo.ObjectId[] {
  return ids.map((id) => new mongo.ObjectId(id));
}

export function isAdminUser(id: mongo.ObjectId) {
  return ADMINS.includes(id.toHexString());
}
