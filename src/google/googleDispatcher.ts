import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { Credentials } from "google-auth-library/build/src/auth/credentials";
import { GoogleApis } from "googleapis";
import mongo from "mongodb";
import readline from "readline";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = ".google_tokens";

export class GoogleDispatcher {
    private googleApi = new GoogleApis();
    private oAuth2Client: OAuth2Client;

    constructor(private database: mongo.Db) {
        this.authorize();
    }

    /** Fetch sheet values */

    public fetchSheet() {
        return new Promise((resolve, reject) => {
            const sheets = this.googleApi.sheets({ version: "v4", auth: this.oAuth2Client });
            sheets.spreadsheets.values.get({
                range: "Users-Data!A132:ZZ134",
                spreadsheetId: process.env.REACT_APP_SPREADSHEET,
            }, (error: Error, value: any) => {
                if (error != null) {
                    reject(error);
                }
                resolve(value.data);
            });
        });
    }

    /** Write sheet values */

    /** Authorize */

    private authorize() {
        this.oAuth2Client =
            new this.googleApi.auth.OAuth2(
                process.env.CLIENT_ID,
                process.env.CLIENT_SECRET,
                process.env.REDIRECT_URI,
            );
        fs.readFile(TOKEN_PATH, async (err, token) => {
            let finalToken: Credentials | null;
            if (err) {
                finalToken = await this.generateNewToken();
            } else {
                finalToken = JSON.parse(token.toString());
            }
            if (finalToken != null) {
                this.oAuth2Client.setCredentials(finalToken as Credentials);
                fs.writeFile(TOKEN_PATH, JSON.stringify(finalToken), (error) => error != null && console.error(error));
            }
        });
    }

    private async generateNewToken(): Promise<Credentials> {
        return new Promise((resolve, reject) => {
            const authUrl = this.oAuth2Client.generateAuthUrl({
                access_type: "online",
                scope: SCOPES,
            });
            console.log("Authorize here:", authUrl);
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
              });
            rl.question("Enter the code from that page here: ", (code) => {
                rl.close();
                this.oAuth2Client.getToken(code, (err, token) => {
                    if (err) {
                        reject(null);
                    }
                    resolve(token);
                });
            });
        });
    }
}
