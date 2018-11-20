import mongo from "mongodb";

import {
  hasCorrectKeys,
  isNumber,
  isSpecificString,
  isString,
  isValidMongoID,
  isValidMongoIDArray,
  isValidPhoneNumber
} from "../utils";
import { requiredUserKeys, validGenders } from "./userConstants";

export function validUserBodyChecker(
  body: any,
  needsToBeDefined: boolean = true
) {
  const errorMessages = [];
  if (
    !isSpecificString(body.gender, validGenders) &&
    checkNeedsToBeDefined(body.gender, needsToBeDefined)
  ) {
    errorMessages.push(`Gender is not M, F, or X: ${body.gender}`);
  }
  if (
    !isString(body.location) &&
    checkNeedsToBeDefined(body.location, needsToBeDefined)
  ) {
    errorMessages.push(`Location is not a string: ${body.location}`);
  }
  if (
    !isString(body.name) &&
    checkNeedsToBeDefined(body.name, needsToBeDefined)
  ) {
    errorMessages.push(`Name is not a string: ${body.name}`);
  }
  if (
    body.phoneNumber !== "" &&
    !isValidPhoneNumber(body.phoneNumber) &&
    checkNeedsToBeDefined(body.phoneNumber, needsToBeDefined)
  ) {
    errorMessages.push(`Phone number is not valid: ${body.phoneNumber}`);
  }
  if (
    body.ignoreUsers !== undefined &&
    !isValidMongoIDArray(body.ignoreUsers) &&
    checkNeedsToBeDefined(body.ignoreUsers, needsToBeDefined)
  ) {
    errorMessages.push(
      `Ignore users must be an array of valid IDs: ${body.ignoreUsers}`
    );
  }
  return errorMessages;
}

function checkNeedsToBeDefined(item: any, needsToBeDefined: boolean) {
  return needsToBeDefined || item !== undefined;
}

export function isValidUser(body: any) {
  const errorMessages = hasCorrectKeys(
    body,
    requiredUserKeys.filter(
      key => key !== "password" && key !== "temporaryPassword"
    )
  );
  if (errorMessages.length > 0) {
    return errorMessages;
  }
  return validUserBodyChecker(body);
}

export function isValidUserUpdate(body: any, currentUserId: mongo.ObjectId) {
  const errorMessages = [];
  if (
    body.ignoreUsers !== undefined &&
    body.ignoreUsers.includes(currentUserId.toHexString())
  ) {
    errorMessages.push("Cannot ignore yourself.");
  }
  return validUserBodyChecker(body, false).concat(errorMessages);
}

export function isValidLogin(body: any) {
  return (
    isValidPhoneNumber(body.phoneNumber) &&
    (isString(body.password) || isNumber(body.temporaryPassword))
  );
}

export function isValidRemoval(body: any) {
  return isValidMongoID(body.removeConnection);
}
