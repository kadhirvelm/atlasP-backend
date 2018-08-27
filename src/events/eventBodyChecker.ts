import mongo from "mongodb";

import {
  isString,
  isValidDate,
  isValidMongoID,
  isValidMongoIDArray,
} from "../utils";

function userIdIsInAttendees(attendees: string[], userId: mongo.ObjectId) {
  return attendees
    .map((attendee: string) => userId.equals(attendee))
    .includes(true);
}

export function isValidEvent(body: any, userId: mongo.ObjectId) {
  const errorMessages = [];
  if (!isValidDate(body.date)) {
    errorMessages.push(`Date is not parseable: ${body.date}`);
  }
  if (!isString(body.description)) {
    errorMessages.push(`Description is not valid: ${body.description}`);
  }
  if (!isValidMongoID(body.host)) {
    errorMessages.push(`Host is not valid: ${body.host}`);
  }
  if (!isValidMongoIDArray(body.attendees)) {
    errorMessages.push(`Attendees contain errors: ${body.attendees}`);
  }
  if (
    !userId.equals(body.host)
    && !userIdIsInAttendees(body.attendees as string[], userId)
  ) {
    errorMessages.push("Authenticated user is not in the event.");
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
