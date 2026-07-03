export const config = {
  port: Number(process.env.API_PORT || 4174),
  databasePath: process.env.DATABASE_PATH || "data/class-assistant.sqlite",
  sessionDays: Number(process.env.SESSION_DAYS || 30),
  loginCodeMinutes: Number(process.env.LOGIN_CODE_MINUTES || 10),
  reminderDaysBefore: parseReminderDays(process.env.REMINDER_DAYS_BEFORE || "7,3,1"),
  reminderScanMinutes: Number(process.env.REMINDER_SCAN_MINUTES || 60),
  appUrl: process.env.APP_URL || "http://127.0.0.1:5173",
  mailFrom: process.env.MAIL_FROM || "课表助手 <no-reply@class-assistant.local>",
  resendApiKey: process.env.RESEND_API_KEY || "",
};

function parseReminderDays(value) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 0);
}
