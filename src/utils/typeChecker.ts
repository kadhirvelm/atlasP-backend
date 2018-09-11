import mongo from "mongodb";

export function isString(item: any): item is string {
  return typeof item === "string";
}

export function isValidPhoneNumber(item: any) {
  return (
    isString(item)
    && item.match(/^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/)
  );
}

export function isNumber(item: any): item is number {
  return typeof item === "number" || parseInt(item, 10).toLocaleString() === item;
}

export function isBoolean(item: any): item is boolean {
  return typeof item === "boolean";
}

export function isStringArray(item: any): item is string[] {
  return typeof item === "object" && item.constructor === Array;
}

export function isSpecificString(item: any, options: string[]): item is string {
  return isString(item) && options.includes(item.toLocaleLowerCase());
}

export function differenceBetweenArrays(array1: string[], array2: string[]) {
  return array1.filter((item) => !array2.includes(item));
}

export function isValidMongoID(id: string) {
  return mongo.ObjectID.isValid(id);
}

export function isValidMongoIDArray(ids: string[]) {
  return ids !== undefined && !ids.map(isValidMongoID).includes(false);
}

export function isValidStringArray(items: string[]) {
  return !items.some((item) => item == null || item === "");
}

export function isValidDate(date: any) {
  return !isNaN(Date.parse(date));
}

export function isValidStringID(
  item: string[] | mongo.ObjectId[],
): item is string[] {
  return typeof item[0] === "string";
}
