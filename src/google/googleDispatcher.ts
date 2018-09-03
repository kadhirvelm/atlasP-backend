import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { Credentials } from "google-auth-library/build/src/auth/credentials";
import { GoogleApis } from "googleapis";
import mongo from "mongodb";
import readline from "readline";

import { EventDatabase, IRawEvent } from "../events";
import { IUser, UserDatabase } from "../users";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = "~/.google_tokens";

export interface IGoogleBatchFetch {
  spreadsheetId: string;
  valueRanges: Array<{
    range: string;
    majorDimension: string;
    values: string[][];
  }>;
}

export class GoogleDispatcher {
  private googleApi = new GoogleApis();

  private oAuth2Client: OAuth2Client;

  private eventDatabase: EventDatabase;

  private userDatabase: UserDatabase;

  constructor(private database: mongo.Db) {
    this.eventDatabase = new EventDatabase(this.database);
    this.userDatabase = new UserDatabase(this.database);
    this.authorize();
  }

  /** Write to database */

  public async populateDatabase() {
    const sheetValues = await this.fetchSheet();
    const peopleValues = sheetValues.valueRanges[0].values.slice(1);
    const eventAttendees: any = {};
    for (const rawUser of peopleValues) {
      const mongoUser = await this.userDatabase.createNewUser(
        this.formatUser(rawUser),
      );
      rawUser.slice(8).forEach((eventID: string) => {
        if (eventAttendees[eventID] === undefined) {
          eventAttendees[eventID] = { attendees: [], host: "" };
        }
        eventAttendees[eventID].attendees.push(mongoUser._id);
        if (eventID.substring(0, 4) === rawUser[0]) {
          eventAttendees[eventID].host = mongoUser._id;
        }
      });
    }
    const eventValues = sheetValues.valueRanges[1].values.slice(1);
    for (const rawEvent of eventValues) {
      await this.eventDatabase.createNewEvent(
        this.formatEvent(rawEvent, eventAttendees),
      );
    }
    return "Successfully populated database.";
  }

  /** Write to sheet */

  public async writeToSheets() {
    return [await this.writeUsers(), await this.writeEvents()];
  }

  /** Authorize */

  public authorize(forceRefresh?: boolean) {
    this.oAuth2Client = new this.googleApi.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI,
    );
    fs.readFile(TOKEN_PATH, async (err, token) => {
      let finalToken: Credentials | null;
      if (err || forceRefresh) {
        this.generateNewToken();
        finalToken = null;
      } else {
        finalToken = JSON.parse(token.toString());
      }

      if (finalToken != null) {
        this.oAuth2Client.setCredentials(finalToken as Credentials);
        fs.writeFile(
          TOKEN_PATH,
          JSON.stringify(finalToken),
          // tslint:disable-next-line:no-console
          (error) => error != null && console.error(error),
        );
      }
    });
  }

  public postNewToken(token: any) {
    this.oAuth2Client.getToken(token, (err, finalToken) => {
      if (err !== null) {
        // tslint:disable-next-line:no-console
        console.error(err);
      }
      fs.writeFile(
        TOKEN_PATH,
        JSON.stringify(finalToken),
        // tslint:disable-next-line:no-console
        (error) => error != null && console.error(error),
      );
      this.authorize();
    });
  }

  /** Utility methods. */

  private fetchSheet(): Promise<IGoogleBatchFetch> {
    return new Promise((resolve, reject) => {
      const sheets = this.googleApi.sheets({
        auth: this.oAuth2Client,
        version: "v4",
      });
      sheets.spreadsheets.values.batchGet(
        {
          ranges: ["Users-Data!A:ZZ", "Events-Data!A:ZZ"],
          spreadsheetId: process.env.REACT_APP_SPREADSHEET,
        },
        (error: Error, value: any) => {
          if (error != null) {
            reject(error);
          }
          resolve(value.data);
        },
      );
    });
  }

  private formatEvent = (eventRaw: any[], eventAttendees: any): IRawEvent => {
    const rawEventDetails = eventAttendees[eventRaw[0]];
    return {
      attendees: rawEventDetails.attendees,
      date: eventRaw[2],
      description: eventRaw[11],
      host: rawEventDetails.host,
    };
  }

  private formatUser = (userRaw: any[]): IUser => ({
    age: userRaw[3],
    gender: userRaw[2],
    location: userRaw[4],
    name: userRaw[1],
    phoneNumber: userRaw[5],
  })

  private async writeUsers() {
    const userData = await this.userDatabase.fetchAll();
    return this.writeData(userData, "Mongo-Users!A:ZZ");
  }

  private async writeEvents() {
    const eventData = await this.eventDatabase.fetchAll();
    return this.writeData(eventData, "Mongo-Events!A:ZZ");
  }

  private async writeData(data: any, sheet: string) {
    return new Promise(async (resolve, reject) => {
      const sheets = this.googleApi.sheets({
        auth: this.oAuth2Client,
        version: "v4",
      });
      sheets.spreadsheets.values.update(
        {
          range: [sheet],
          resource: {
            values: this.formatForWriting(data),
          },
          spreadsheetId: process.env.REACT_APP_SPREADSHEET,
          valueInputOption: "USER_ENTERED",
        },
        (error: Error, value: any) => {
          if (error != null) {
            reject(error);
          }
          resolve(value.data);
        },
      );
    });
  }

  private formatForWriting = (multipleObjects: any) => multipleObjects.map((singleObject: any) => Object.values(singleObject).map((value: any) => JSON.stringify(value)));

  private async generateNewToken() {
    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: "online",
      scope: SCOPES,
    });
    // tslint:disable-next-line:no-console
    console.log("Authorize here:", authUrl);
    return "New token generation needed.";
  }
}
