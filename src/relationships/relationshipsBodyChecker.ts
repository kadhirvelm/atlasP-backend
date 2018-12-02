import mongo from "mongodb";
import { isString } from "util";
import { isNumber, isValidMongoID } from "../utils";

export function validRelationshipBodyChecker(body: any) {
  const errorMessages: string[] = [];
  Object.keys(body.frequency).map(id => {
    if (!isValidMongoID(id)) {
      errorMessages.push(`Invalid id in the frequency: ${id}`);
    }
    if (!isNumber(body.frequency[id]) && body.frequency[id] !== "IGNORE") {
      errorMessages.push(
        `An invalid frequency was provided: ${body.frequency[id]}`
      );
    }
    if (isNumber(body.frequency[id]) && body.frequency[id] <= 0) {
      errorMessages.push(
        `A frequency must be a positive number or IGNORE: ${body.frequency[id]}`
      );
    }
    if (isString(body.frequency[id]) && body.frequency[id] !== "IGNORE") {
      errorMessages.push(
        `A frequency must be IGNORE or a number: ${body.frequency[id]}`
      );
    }
  });
  return errorMessages;
}

export function isValidRelationshipUpdate(
  body: any,
  currentUserId: mongo.ObjectId
) {
  const errorMessages = [];
  if (body.frequency[currentUserId.toHexString()] !== undefined) {
    errorMessages.push("Cannot add yourself to a frequency.");
  }
  return validRelationshipBodyChecker(body).concat(errorMessages);
}
