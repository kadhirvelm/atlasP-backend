import { assert } from "chai";

export function compareEvents(actualEvent: any, expectedEvent: any) {
  const actualEventCopy = Object.assign({}, actualEvent);
  delete actualEventCopy._id;
  delete actualEventCopy.date;
  assert.deepEqual(actualEventCopy, expectedEvent);
}
