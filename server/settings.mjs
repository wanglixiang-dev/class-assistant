export function createSettingsRepository(db, config) {
  const defaults = () => ({
    examReminderEnabled: true,
    reminderDaysBefore: [...config.reminderDaysBefore],
  });

  function getSettings(userId) {
    const row = db.prepare("SELECT payload FROM user_settings WHERE user_id = ?").get(userId);
    if (!row) return defaults();

    try {
      return normalizeSettings(JSON.parse(row.payload), defaults());
    } catch {
      return defaults();
    }
  }

  function saveSettings(userId, input) {
    const settings = normalizeSettings(input, defaults());
    db.prepare(
      `INSERT INTO user_settings (user_id, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`
    ).run(userId, JSON.stringify(settings), new Date().toISOString());
    return settings;
  }

  return { getSettings, saveSettings };
}

export function normalizeSettings(input, defaults) {
  const source = input && typeof input === "object" ? input : {};
  const days = Array.isArray(source.reminderDaysBefore)
    ? [...new Set(source.reminderDaysBefore.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 60))]
        .sort((a, b) => b - a)
        .slice(0, 10)
    : defaults.reminderDaysBefore;

  return {
    examReminderEnabled:
      typeof source.examReminderEnabled === "boolean" ? source.examReminderEnabled : defaults.examReminderEnabled,
    reminderDaysBefore: days,
  };
}
