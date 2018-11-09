import mongo from "mongodb";

import {
  hasCorrectKeys,
  isNumber,
  isSpecificString,
  isString,
  isValidMongoID,
  isValidMongoIDArray,
  isValidPhoneNumber,
  isValidStringArray,
} from "../utils";
import { requiredUserKeys, validGenders } from "./userConstants";

export function validUserBodyChecker(body: any) {
  const errorMessages = [];
  if (!isSpecificString(body.gender, validGenders)) {
    errorMessages.push(`Gender is not M, F, or X: ${body.gender}`);
  }
  if (!isString(body.location)) {
    errorMessages.push(`Location is not a string: ${body.location}`);
  }
  if (!isString(body.name)) {
    errorMessages.push(`Name is not a string: ${body.name}`);
  }
  if (body.phoneNumber !== "" && !isValidPhoneNumber(body.phoneNumber)) {
    errorMessages.push(`Phone number is not valid: ${body.phoneNumber}`);
  }
  if (body.ignoreUsers !== undefined && !isValidMongoIDArray(body.ignoreUsers)) {
    errorMessages.push(`Ignore users must be an array of valid IDs: ${body.ignoreUsers}`);
  }
  return errorMessages;
}

export function isValidUser(body: any) {
  const errorMessages = hasCorrectKeys(
    body,
    requiredUserKeys.filter(
      (key) => key !== "password" && key !== "temporaryPassword",
    ),
  );
  if (errorMessages.length > 0) {
    return errorMessages;
  }
  return validUserBodyChecker(body);
}

export function isValidUserUpdate(body: any, currentUserId: mongo.ObjectId) {
  const errorMessages = hasCorrectKeys(body, requiredUserKeys);
  if (!isValidStringArray(Object.values(body))) {
    errorMessages.push("Cannot leave fields blank.");
  }
  if (body.ignoreUsers !== undefined && body.ignoreUsers.includes(currentUserId.toHexString())) {
    errorMessages.push("Cannot ignore yourself.");
  }
  return validUserBodyChecker(body);
}

export function isValidLogin(body: any) {
  return (
    isValidPhoneNumber(body.phoneNumber)
    && (isString(body.password) || isNumber(body.temporaryPassword))
  );
}

export function isValidRemoval(body: any) {
  return isValidMongoID(body.removeConnection);
}
