import mongo from "mongodb";
import {
  IRelationship,
  RELATIONSHIPS_COLLECTION
} from "./relationshipsConstants";

export class RelationshipsDatabase {
  constructor(private db: mongo.Db) {}

  public async getAllRelationships(
    userId: mongo.ObjectID
  ): Promise<IRelationship> {
    const allRelationships = await this.db
      .collection(RELATIONSHIPS_COLLECTION)
      .find({ _id: userId });
    return allRelationships.next();
  }

  public async updateRelationships(
    userId: mongo.ObjectId,
    relationship: Partial<IRelationship>
  ) {
    const { frequency } = await this.getAllRelationships(userId);
    const updatedRelationship = await this.db
      .collection(RELATIONSHIPS_COLLECTION)
      .replaceOne(
        { _id: userId },
        {
          _id: userId,
          frequency: {
            ...frequency,
            ...relationship.frequency
          }
        },
        { upsert: true }
      );
    return updatedRelationship;
  }
}
