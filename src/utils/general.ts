import express from "express";
import mongo from "mongodb";

import { IFullUser } from "../users";

import { IAccount } from "../account";
import { IFullEvent } from "../events";
import { IRelationship } from "../relationships";
import { generateAuthenticationToken } from "./security";

const ADMINS: string[] = ["5b9a88d54f36eb0020736b43"];

export function sendError(res?: express.Response, message?: string[]) {
  const errorMessage = {
    message,
    status: "Error, improperly formatted data"
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
  return phoneNumber.slice().replace(/[^0-9,+]/g, "");
}

export function sanitizeUser(
  user: IFullUser,
  shouldGenerateToken: boolean = true
) {
  const finalUser = { ...user };
  delete finalUser.password;
  delete finalUser.temporaryPassword;
  const authenticationToken =
    shouldGenerateToken && generateAuthenticationToken(user._id);
  return {
    token: authenticationToken,
    userDetails: finalUser
  };
}

export function fullSanitizeUser(user: IFullUser) {
  const { userDetails } = sanitizeUser(user, false);
  delete userDetails.connections;
  delete userDetails.createdBy;
  delete userDetails.phoneNumber;
  return userDetails;
}

export function parseIntoObjectIDs(ids: string[]): mongo.ObjectId[] {
  return ids.map(id => new mongo.ObjectId(id));
}

export function isAdminUser(id: mongo.ObjectId) {
  return ADMINS.includes(id.toHexString());
}

export function flatten(previous: any[], next: any[]) {
  return previous.concat(next);
}

export function convertArrayToMap<
  T extends IFullUser | IFullEvent | IRelationship | IAccount
>(itemArray: T[]): Map<string, T> {
  const iteratable: Array<[string, T]> = itemArray.map(
    (item): [string, T] => [item._id.toHexString(), item]
  );
  return new Map(iteratable);
}
