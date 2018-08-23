import crypto from "crypto";

export function sanitizePhoneNumber(phoneNumber: string) {
  return phoneNumber.slice().replace(/![0-9]/g, "");
}

export function hmacCheck(item: string) {
  return crypto.createHmac("sha256", process.env.NODE_SECRET).update(item).digest("hex");
}

export function hashPassword(password: string | undefined) {
  return crypto.createHash("sha256").update(password || "").digest("hex");
}
