import { isValidDate, isValidMongoID } from "../utils";

export function isValidUpgrade(body: any): string[] {
  const errors = [];
  if (!isValidMongoID(body.userId)) {
    errors.push(`That doesn't seem to be a valid user id: ${body.userId}`);
  }
  if (!isValidDate(body.expiration)) {
    errors.push(
      `Hum, the expiration date doesn't seem correct: ${body.expiration}`
    );
  }
  if (new Date(body.expiration).getTime() - new Date().getTime() < 0) {
    errors.push("Cannot have an expiration date in the past");
  }
  return errors;
}
