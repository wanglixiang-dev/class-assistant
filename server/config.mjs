import "./env.mjs";

export const config = {
  port: Number(process.env.API_PORT || 4174),
  databasePath: process.env.DATABASE_PATH || "data/class-assistant.sqlite",
  sessionDays: Number(process.env.SESSION_DAYS || 30),
  loginCodeMinutes: Number(process.env.LOGIN_CODE_MINUTES || 10),
  reminderDaysBefore: parseReminderDays(process.env.REMINDER_DAYS_BEFORE || "7,3,1"),
  reminderScanMinutes: Number(process.env.REMINDER_SCAN_MINUTES || 60),
  appUrl: process.env.APP_URL || "http://127.0.0.1:5173",
  mailFrom: process.env.MAIL_FROM || "课表助手 <no-reply@mail.wanglx.top>",
  directMailHost: process.env.DIRECTMAIL_SMTP_HOST || "smtpdm.aliyun.com",
  directMailPort: Number(process.env.DIRECTMAIL_SMTP_PORT || 465),
  directMailSecure: parseBoolean(process.env.DIRECTMAIL_SMTP_SECURE ?? "true"),
  directMailUser: process.env.DIRECTMAIL_SMTP_USER || "",
  directMailPassword: process.env.DIRECTMAIL_SMTP_PASSWORD || "",
};

function parseReminderDays(value) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 0);
}

function parseBoolean(value) {
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}
