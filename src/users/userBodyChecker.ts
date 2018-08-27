import { validGenders, validUserKeys } from "./userConstants";

import {
  differenceBetweenArrays,
  isNumber,
  isSpecificString,
  isString,
  isValidPhoneNumber,
  isValidStringArray,
} from "../utils";

function hasValidUserKeys(body: any) {
  const extraKeys = differenceBetweenArrays(Object.keys(body), validUserKeys);
  return extraKeys.length > 0 ? [`Contains extra fields: ${extraKeys}`] : [];
}

function hasCorrectKeys(body: any, checkForKeys: string[]) {
  const errorMessages = hasValidUserKeys(body);
  const missingKeys = differenceBetweenArrays(checkForKeys, Object.keys(body));
  if (missingKeys.length > 0) {
    errorMessages.push(`Missing fields: ${missingKeys}`);
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

  if (!isNumber(body.age)) {
    errorMessages.push(`Age is not a number: ${body.age}`);
  }
  if (!isSpecificString(body.gender, validGenders)) {
    errorMessages.push(`Gender is not M, F, or X: ${body.gender}`);
  }
  if (!isString(body.location)) {
    errorMessages.push(`Location is not a string: ${body.location}`);
  }
  if (!isString(body.name)) {
    errorMessages.push(`Name is not a string: ${body.name}`);
  }
  if (!isValidPhoneNumber(body.phoneNumber)) {
    errorMessages.push(`Phone number is not valid: ${body.phoneNumber}`);
  }
  return errorMessages;
}

export function isValidUserUpdate(body: any) {
  const errorMessages = hasValidUserKeys(body);
  if (!isValidStringArray(Object.values(body))) {
    errorMessages.push("Cannot include empty or null fields.");
  }
  return errorMessages;
}

export function isValidLogin(body: any) {
  return (
    isValidPhoneNumber(body.phoneNumber)
    && (isString(body.password) || isNumber(body.temporaryPassword))
  );
}
