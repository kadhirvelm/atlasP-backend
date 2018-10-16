import { validGenders, validUserKeys } from "./userConstants";

import {
  hasCorrectKeys,
  isNumber,
  isSpecificString,
  isString,
  isValidPhoneNumber,
  isValidStringArray,
} from "../utils";

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
  return errorMessages;
}

export function isValidUser(body: any) {
  const errorMessages = hasCorrectKeys(
    body,
    validUserKeys.filter(
      (key) => key !== "password" && key !== "temporaryPassword",
    ),
  );
  if (errorMessages.length > 0) {
    return errorMessages;
  }
  return validUserBodyChecker(body);
}

export function isValidUserUpdate(body: any) {
  const errorMessages = hasCorrectKeys(body, validUserKeys);
  if (!isValidStringArray(Object.values(body))) {
    errorMessages.push("Cannot leave fields blank.");
  }
  return validUserBodyChecker(body);
}

export function isValidLogin(body: any) {
  return (
    isValidPhoneNumber(body.phoneNumber)
    && (isString(body.password) || isNumber(body.temporaryPassword))
  );
}
