import mongo from "mongodb";
import {
  IRelationship,
  RELATIONSHIPS_COLLECTION
} from "./relationshipsConstants";

export class RelationshipsDatabase {
  constructor(private db: mongo.Db) {}

  public async getAllRelationships(userId: mongo.ObjectID) {
    const allRelationships = await this.db
      .collection(RELATIONSHIPS_COLLECTION)
      .find({ _id: userId });
    return allRelationships.next();
  }

  public async updateRelationships(
    userId: mongo.ObjectId,
    relationship: Partial<IRelationship>
  ) {
    const updatedRelationship = await this.db
      .collection(RELATIONSHIPS_COLLECTION)
      .replaceOne(
        { _id: userId },
        { _id: userId, ...relationship },
        { upsert: true }
      );
    return updatedRelationship;
  }
}
