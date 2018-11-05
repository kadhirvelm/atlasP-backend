import { CronJob } from "cron";
import express from "express";
import mongo from "mongodb";
import nodemailer from "nodemailer";
import ses from "nodemailer-ses-transport";

import { PureRouter } from "../general";
import {
  createEventsMailBody,
  createMailSubject,
  createPeopleMailBody,
  getAllInactiveUsers,
  getAllUsers,
  getEventsHappeningIn24Hours,
  getEventsHappeningInTwoDays,
} from "./reporterGeneratorUtils";

const REPORT_RECIPIENTS = ["luke.walquist@gmail.com", "kadhirvelm@gmail.com"];

export const REPORT_ROOT = "/reports";

class PureReporter extends PureRouter {
  constructor(private database: mongo.Db) {
    super();
    this.initiateCronJobReporting();
    this.mountPublicRoutes();
  }

  public initiateCronJobReporting = async () => {
    const report = new CronJob(
      "0 6 * * *",
      this.createReport,
      null,
      false,
      "Asia/Singapore",
    );
    report.start();
  }

  public mountPublicRoutes() {
    this.router.get("/generate", this.sendOutReport);
  }

  /**
   * Public routes
   */

  private sendOutReport = async (
    req: express.Request,
    res: express.Response,
  ) => {
    await this.createReport();
    return res.json({
      message: "Sent report to recipients.",
    });
  }

  /**
   * Generator functions
   */

  private createReport = async () => {
    const eventsMadeInLast24Hours = await getEventsHappeningIn24Hours(
      this.database,
    );
    const eventsInTwoDays = await getEventsHappeningInTwoDays(this.database);
    const allUsers = await getAllUsers(
      this.database,
      eventsInTwoDays,
      eventsMadeInLast24Hours,
    );
    const mailEventBody = createEventsMailBody(
      eventsMadeInLast24Hours,
      eventsInTwoDays,
      allUsers,
    );

    const allInactiveUsers = await getAllInactiveUsers(this.database);
    const mailPeopleBody = createPeopleMailBody(allInactiveUsers);

    this.sendEmail(`<div><b>Events</b><br />${mailEventBody}<br /><br /><b>People</b><br />${mailPeopleBody}</div>`);
  }

  private sendEmail = (mailBody: string) => {
    const transporter = nodemailer.createTransport(
      ses({
        accessKeyId: "AKIAIUXM6T7JECPWZUSQ",
        region: "us-west-2",
        secretAccessKey: process.env.CLIENT_GMAIL_SECRET,
      } as any),
    );

    const mailOptions = {
      from: "atlas.people.1@gmail.com",
      html: mailBody,
      subject: createMailSubject(),
      to: REPORT_RECIPIENTS,
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
}

export const ReporterRoutes = (database: mongo.Db) => new PureReporter(database).router;
