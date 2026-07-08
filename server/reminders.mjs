const DAY_MS = 24 * 60 * 60 * 1000;

export function createReminderService(db, emailService, config, settingsRepository) {
  async function scanAndSend() {
    const today = startOfLocalDay(new Date());
    const users = db.prepare("SELECT id, email FROM users").all();
    let sentCount = 0;

    for (const user of users) {
      const settings = settingsRepository.getSettings(user.id);
      if (!settings.examReminderEnabled || settings.reminderDaysBefore.length === 0) continue;

      const courses = db
        .prepare("SELECT id, payload FROM courses WHERE user_id = ?")
        .all(user.id)
        .map((row) => ({ id: row.id, course: JSON.parse(row.payload) }));

      for (const item of courses) {
        const examDate = parseExamDate(item.course.examDate);
        if (!examDate) continue;

        const daysUntilExam = Math.round((examDate.getTime() - today.getTime()) / DAY_MS);
        if (!settings.reminderDaysBefore.includes(daysUntilExam)) continue;
        if (hasReminderLog(user.id, item.id, item.course.examDate, daysUntilExam)) continue;

        await emailService.sendEmail({
          to: user.email,
          subject: `考试提醒：${item.course.name}`,
          text: [
            `${item.course.name} 将在 ${item.course.examDate} 考试。`,
            `距离考试还有 ${daysUntilExam} 天。`,
            item.course.classroom ? `地点：${item.course.classroom}` : "",
            item.course.note ? `备注：${item.course.note}` : "",
            "",
            `打开课表助手：${config.appUrl}`,
          ]
            .filter(Boolean)
            .join("\n"),
        });

        writeReminderLog(user.id, item.id, item.course.examDate, daysUntilExam);
        sentCount += 1;
      }
    }

    return { sentCount };
  }

  function start() {
    scanAndSend().catch((error) => console.error("[reminder] scan failed", error));
    setInterval(() => {
      scanAndSend().catch((error) => console.error("[reminder] scan failed", error));
    }, config.reminderScanMinutes * 60 * 1000);
  }

  function hasReminderLog(userId, courseId, examDate, daysBefore) {
    return Boolean(
      db
        .prepare(
          "SELECT 1 FROM reminder_logs WHERE user_id = ? AND course_id = ? AND exam_date = ? AND days_before = ?"
        )
        .get(userId, courseId, examDate, daysBefore)
    );
  }

  function writeReminderLog(userId, courseId, examDate, daysBefore) {
    db.prepare(
      "INSERT INTO reminder_logs (user_id, course_id, exam_date, days_before, sent_at) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, courseId, examDate, daysBefore, new Date().toISOString());
  }

  return { scanAndSend, start };
}

function parseExamDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
