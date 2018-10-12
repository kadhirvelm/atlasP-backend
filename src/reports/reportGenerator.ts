import { CronJob } from "cron";
import mongo from "mongodb";
import nodemailer from "nodemailer";
import ses from "nodemailer-ses-transport";

import { EVENTS_COLLECTION } from "../events";
import { USERS_COLLECTION } from "../users";
import { fullSanitizeUser } from "../utils";

export class ReportGenerator {
  constructor(private database: mongo.Db) {}

  public async watchForSendingReport() {
    const report = new CronJob(
      "0 6 * * *",
      () => {
        this.createReport();
      },
      null,
      false,
      "Asia/Singapore",
    );
    report.start();
  }

  private async createReport() {
    const eventsInTwoDays = await this.database
      .collection(EVENTS_COLLECTION)
      .find({
        date: {
          $gte: this.incrementDate(new Date(), 2),
          $lte: this.incrementDate(new Date(), 3),
        },
      })
      .toArray();
    const eventsMadeInLast24Hours = await this.database
      .collection(EVENTS_COLLECTION)
      .find({
        _id: {
          $gte: mongo.ObjectId.createFromTime(
            this.incrementDate(new Date(), -1).getTime() / 1000,
          ),
        },
      })
      .toArray();

    const allUsers = await this.database
      .collection(USERS_COLLECTION)
      .find({
        _id: {
          $in: [
            ...eventsInTwoDays.map(this.extractUsers),
            ...eventsMadeInLast24Hours.map(this.extractUsers),
          ].reduce((a, b) => [...a, ...b], []),
        },
      })
      .toArray();
    const sanitizedUsers = allUsers
      .map(fullSanitizeUser)
      .map((user) => ({ [user._id.toHexString()]: user }))
      .reduce((a, b) => ({ ...a, ...b }), []);

    this.sendEmail(eventsInTwoDays, eventsMadeInLast24Hours, sanitizedUsers);
  }

  private sendEmail(
    eventsInTwoDays: any[],
    eventsMadeInLast24Hours: any[],
    sanitizedUsers: any,
  ) {
    const transporter = nodemailer.createTransport(
      ses({
        accessKeyId: "AKIAIUXM6T7JECPWZUSQ",
        region: "us-west-2",
        secretAccessKey: process.env.CLIENT_GMAIL_SECRET,
      } as any),
    );
    const mailOptions = {
      from: "atlas.people.1@gmail.com",
      html: `
                <div>
                    <b>Events created in the last 24 hours:</b>
                    ${eventsMadeInLast24Hours
    .map((event) => this.createSingleEventString(event, sanitizedUsers))
    .join("\n")}
                    <br />
                    <b>Events happening in 2 days:</b>
                    ${eventsInTwoDays
    .map((event) => this.createSingleEventString(event, sanitizedUsers))
    .join("\n")}
                </div>
            `,
      subject: `AtlasP Text Report - ${new Date().toLocaleDateString()} (${
        process.env.NODE_ENV
      })`,
      to: "luke.walquist@gmail.com, kadhirvelm@gmail.com",
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        // tslint:disable-next-line:no-console
        console.error(err);
      }
      // tslint:disable-next-line:no-console
      console.log(info);
    });
  }

  private createSingleEventString(event: any, sanitizedUsers: any) {
    return `
            <div>
                ${event.description}, ${new Date(
  event.date,
).toLocaleDateString()}, ${event._id},
                <b>${this.renderSingleAttendee(
    event.host,
    sanitizedUsers,
  )}, </b>
                ${event.attendees
    .filter(
      (user: any) => user.toString() !== event.host.toString(),
    )
    .map((user: any) => this.renderSingleAttendee(user, sanitizedUsers))
    .join(", ")}
            </div>
        `;
  }

  private renderSingleAttendee = (user: string, sanitizedUsers: any) => `${sanitizedUsers[user].name}, +1${sanitizedUsers[user].phoneNumber}`;

  private extractUsers = (event: any) => [
    this.convertToMongoId(event.host),
    ...event.attendees.map(this.convertToMongoId),
  ]

  private convertToMongoId = (id: string) => new mongo.ObjectId(id);

  private incrementDate = (date: Date, days: number) => {
    date.setDate(date.getDate() + days);
    return date;
  }
}
