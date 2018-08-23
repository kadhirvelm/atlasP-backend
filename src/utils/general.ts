export function sanitizePhoneNumber(phoneNumber: string) {
  return phoneNumber.slice().replace(/![0-9]/g, "");
}
