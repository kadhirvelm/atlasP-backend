import mongo from "mongodb";

/**
 * The number in all relationships corresponds to the number
 * of days in which a user wants to see a friend.
 *
 * If the number is negative, that means the user is on the
 * ignore list.
 */
export interface IRelationship {
  _id: mongo.ObjectId;
  frequency: {
    [id: string]: number | "IGNORE";
  };
}

export const RELATIONSHIPS_COLLECTION = "RELATIONSHIPS";
