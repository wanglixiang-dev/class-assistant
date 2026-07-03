import { createServer } from "node:http";
import { config } from "./config.mjs";
import { createAuthService, HttpError } from "./auth.mjs";
import { createCourseRepository } from "./courses.mjs";
import { openDatabase } from "./database.mjs";
import { createEmailService } from "./email.mjs";
import { createReminderService } from "./reminders.mjs";

const db = openDatabase(config.databasePath);
const emailService = createEmailService(config);
const authService = createAuthService(db, emailService, config);
const courseRepository = createCourseRepository(db);
const reminderService = createReminderService(db, emailService, config);

const server = createServer(async (request, response) => {
  try {
    await route(request, response);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "服务异常";
    if (status >= 500) console.error(error);
    sendJson(response, status, { error: message });
  }
});

server.listen(config.port, "127.0.0.1", () => {
  console.info(`API server listening on http://127.0.0.1:${config.port}`);
});

reminderService.start();

async function route(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/request-code") {
    const body = await readJson(request);
    await authService.requestLoginCode(body.email);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/verify-code") {
    const body = await readJson(request);
    sendJson(response, 200, authService.verifyLoginCode(body.email, body.code));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/me") {
    sendJson(response, 200, { user: authService.authenticate(request) });
    return;
  }

  if (url.pathname === "/api/courses") {
    const user = authService.authenticate(request);

    if (request.method === "GET") {
      sendJson(response, 200, { courses: courseRepository.listCourses(user.id) });
      return;
    }

    if (request.method === "PUT") {
      const body = await readJson(request);
      sendJson(response, 200, { courses: courseRepository.replaceCourses(user.id, body.courses || []) });
      return;
    }
  }

  if (url.pathname.startsWith("/api/courses/")) {
    const user = authService.authenticate(request);
    const courseId = decodeURIComponent(url.pathname.replace("/api/courses/", ""));

    if (request.method === "PUT") {
      const body = await readJson(request);
      sendJson(response, 200, { course: courseRepository.upsertCourse(user.id, body.course) });
      return;
    }

    if (request.method === "DELETE") {
      courseRepository.deleteCourse(user.id, courseId);
      sendJson(response, 200, { ok: true });
      return;
    }
  }

  if (request.method === "POST" && url.pathname === "/api/reminders/run") {
    authService.authenticate(request);
    sendJson(response, 200, await reminderService.scanAndSend());
    return;
  }

  sendJson(response, 404, { error: "接口不存在" });
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "请求 JSON 格式错误");
  }
}
