import express from "express";

import { IFullUser } from "../users";

import { generateAuthenticationToken } from "./security";

export function sendError(res: express.Response, message: string[]) {
  res.status(400).json({
    message,
    status: "Error, improperly formatted data",
  });
}

export function sanitizePhoneNumber(phoneNumber: string) {
  return phoneNumber.slice().replace(/![0-9]/g, "");
}

export function sanitizeUser(user: IFullUser) {
  const finalUser = { ...user };
  delete finalUser.password;
  delete finalUser.temporaryPassword;
  const authenticationToken = generateAuthenticationToken(user._id);
  return {
    token: authenticationToken,
    userDetails: finalUser,
  };
}
