import { assert } from "chai";
import "mocha";
import mongo from "mongodb";

import { DEFAULT_MONGOID } from "../../utils/__tests__/usersUtils";
import { isValidEvent } from "../eventBodyChecker";

describe("Event body checker", () => {
  it("should return default body errors", () => {
    const result = isValidEvent({}, new mongo.ObjectId(DEFAULT_MONGOID));
    assert.deepEqual(result,
      [
        "Date is not valid: undefined",
        "Description is not valid: undefined",
        "Attendees contain errors: undefined",
        "You're not in the event.",
      ],
      "Incorrect value");
  });
});
