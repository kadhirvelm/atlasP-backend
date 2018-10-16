import mongo from "mongodb";

import {
  isString,
  isValidDate,
  isValidMongoID,
  isValidMongoIDArray,
} from "../utils";

function userIdIsInAttendees(
  attendees: string[] | undefined,
  userId: mongo.ObjectId,
) {
  if (attendees === undefined) {
    return false;
  }
  return attendees.includes(userId.toHexString());
}

export function isValidEvent(body: any, userId: mongo.ObjectId) {
  const errorMessages = [];
  if (!isValidDate(body.date)) {
    errorMessages.push(`Date is not valid: ${body.date}`);
  }
  if (!isString(body.description)) {
    errorMessages.push(`Description is not valid: ${body.description}`);
  }
  if (!isValidMongoIDArray(body.attendees)) {
    errorMessages.push(`Attendees contain errors: ${body.attendees}`);
  }
  if (!userIdIsInAttendees(body.attendees as string[], userId)) {
    errorMessages.push("You're not in the event.");
  }
  if (body.attendees.length === 1 && body.attendees[0] === userId.toHexString()) {
    errorMessages.push("You cannot be in an event by yourself.");
  }
  return errorMessages;
}

export function isValidEventUpdate(body: any, userId: mongo.ObjectId) {
  const errorMessages = isValidEvent(body, userId);
  if (!isValidMongoID(body.eventId)) {
    errorMessages.push(`Event ID is invalid: ${body.eventId}`);
  }
  return errorMessages;
}
