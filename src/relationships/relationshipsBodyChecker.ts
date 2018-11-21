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
