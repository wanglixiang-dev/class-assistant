import { randomBytes, randomInt, randomUUID } from "node:crypto";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createAuthService(db, emailService, config) {
  async function requestLoginCode(email) {
    const normalizedEmail = normalizeEmail(email);
    const code = String(randomInt(100000, 1000000));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.loginCodeMinutes * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO login_codes (email, code, expires_at, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at, created_at = excluded.created_at`
    ).run(normalizedEmail, code, expiresAt, now.toISOString());

    await emailService.sendEmail({
      to: normalizedEmail,
      subject: "课表助手登录验证码",
      text: `你的课表助手登录验证码是：${code}\n\n验证码 ${config.loginCodeMinutes} 分钟内有效。`,
    });
  }

  function verifyLoginCode(email, code) {
    const normalizedEmail = normalizeEmail(email);
    const inputCode = String(code || "").trim();
    const record = db.prepare("SELECT * FROM login_codes WHERE email = ?").get(normalizedEmail);
    if (!record || record.code !== inputCode || Date.parse(record.expires_at) < Date.now()) {
      throw new HttpError(401, "验证码无效或已过期");
    }

    db.prepare("DELETE FROM login_codes WHERE email = ?").run(normalizedEmail);

    const user = findOrCreateUser(normalizedEmail);
    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.sessionDays * 24 * 60 * 60 * 1000).toISOString();
    db.prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
      token,
      user.id,
      expiresAt,
      now.toISOString()
    );

    return { token, user };
  }

  function authenticate(request) {
    const authorization = request.headers.authorization || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) throw new HttpError(401, "请先登录");

    const row = db
      .prepare(
        `SELECT users.id, users.email, users.created_at
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.token = ? AND sessions.expires_at > ?`
      )
      .get(token, new Date().toISOString());

    if (!row) throw new HttpError(401, "登录已过期，请重新登录");
    return { id: row.id, email: row.email, createdAt: row.created_at };
  }

  function findOrCreateUser(email) {
    const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (existing) return { id: existing.id, email: existing.email, createdAt: existing.created_at };

    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)").run(id, email, now);
    return { id, email, createdAt: now };
  }

  return { authenticate, requestLoginCode, verifyLoginCode };
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function normalizeEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    throw new HttpError(400, "请输入有效邮箱");
  }
  return normalized;
}
