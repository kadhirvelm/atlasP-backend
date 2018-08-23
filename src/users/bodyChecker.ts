import {
  differenceBetweenArrays,
  isNumber,
  isSpecificString,
  isString,
  isValidPhoneNumber,
} from "../utils";
import { validGenders, validUserKeys } from "./users";

function hasCorrectKeys(body: any) {
  const errorMessages = [];
  const extraKeys = differenceBetweenArrays(Object.keys(body), validUserKeys);
  if (extraKeys.length > 0) {
    errorMessages.push(`Contains extra fields: ${extraKeys}`);
  }
  const missingKeys = differenceBetweenArrays(validUserKeys, Object.keys(body));
  if (extraKeys.length > 0) {
    errorMessages.push(`Missing fields: ${missingKeys}`);
  }
  return errorMessages;
}

export function isValidUser(body: any) {
  const errorMessages = hasCorrectKeys(body);
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
