import mongo from "mongodb";
import { isValidMongoIDArray } from "../utils";

export function validRelationshipBodyChecker(body: any) {
  const errorMessages = [];
  if (
    body.ignoreUsers !== undefined &&
    !isValidMongoIDArray(body.ignoreUsers)
  ) {
    errorMessages.push(
      `Ignore users must be an array of valid IDs: ${body.ignoreUsers}`
    );
  }
  if (
    body.frequentUsers !== undefined &&
    !isValidMongoIDArray(body.frequentUsers)
  ) {
    errorMessages.push(
      `Close friends users must be an array of valid IDs: ${body.frequentUsers}`
    );
  }
  if (
    body.semiFrequentUsers !== undefined &&
    !isValidMongoIDArray(body.semiFrequentUsers)
  ) {
    errorMessages.push(
      `Family users must be an array of valid IDs: ${body.semiFrequentUsers}`
    );
  }
  return errorMessages;
}

export function isValidRelationshipUpdate(
  body: any,
  currentUserId: mongo.ObjectId
) {
  const errorMessages = [];
  if (
    body.ignoreUsers !== undefined &&
    body.ignoreUsers.includes(currentUserId.toHexString())
  ) {
    errorMessages.push("Cannot ignore yourself.");
  }
  return validRelationshipBodyChecker(body).concat(errorMessages);
}
