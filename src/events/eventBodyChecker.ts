import { isString, isValidDate, isValidMongoID, isValidMongoIDArray } from "../utils";

export function isValidEvent(body: any) {
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
    return errorMessages;
}
