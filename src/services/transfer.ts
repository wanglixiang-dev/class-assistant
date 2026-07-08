import type { Course } from "../domain/course";
import { courseColors, generateCourseId, normalizeWeekType, validateCourse } from "../domain/course";

export interface ExportPayload {
  app: "class-assistant";
  version: 1;
  exportedAt: string;
  semesterStart: string;
  courses: Course[];
}

export interface ImportResult {
  courses: Course[];
  semesterStart: string;
  skippedCount: number;
}

export function buildExportPayload(courses: Course[], semesterStart: string): ExportPayload {
  return {
    app: "class-assistant",
    version: 1,
    exportedAt: new Date().toISOString(),
    semesterStart,
    courses,
  };
}

export function buildExportFileName(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `课表-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

/** 解析导入文件，兼容导出格式和纯课程数组；无有效课程时抛错 */
export function parseImportPayload(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("文件不是有效的 JSON");
  }

  const rawCourses = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { courses?: unknown }).courses)
      ? ((parsed as { courses: unknown[] }).courses)
      : null;

  if (!rawCourses) {
    throw new Error("文件中没有课程数据");
  }

  const courses: Course[] = [];
  rawCourses.forEach((raw, index) => {
    const course = sanitizeCourse(raw, index);
    if (course) courses.push(course);
  });

  if (courses.length === 0) {
    throw new Error("文件中没有可导入的有效课程");
  }

  const semesterStart =
    !Array.isArray(parsed) && typeof (parsed as { semesterStart?: unknown }).semesterStart === "string"
      ? ((parsed as { semesterStart: string }).semesterStart)
      : "";

  return { courses, semesterStart, skippedCount: rawCourses.length - courses.length };
}

function sanitizeCourse(raw: unknown, index: number): Course | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const now = new Date().toISOString();

  const course: Course = {
    id: typeof source.id === "string" && source.id ? source.id : generateCourseId(),
    name: asString(source.name),
    teacher: asString(source.teacher),
    classroom: asString(source.classroom),
    weekday: Number(source.weekday),
    startPeriod: Number(source.startPeriod),
    endPeriod: Number(source.endPeriod),
    startWeek: Number(source.startWeek),
    endWeek: Number(source.endWeek),
    weekType: normalizeWeekType(source.weekType),
    color: typeof source.color === "string" && source.color ? source.color : courseColors[index % courseColors.length],
    homework: asString(source.homework),
    examDate: /^\d{4}-\d{2}-\d{2}$/.test(asString(source.examDate)) ? asString(source.examDate) : "",
    note: asString(source.note),
    locationName: asString(source.locationName),
    locationAddress: asString(source.locationAddress),
    longitude: asNumberOrNull(source.longitude),
    latitude: asNumberOrNull(source.latitude),
    createdAt: asString(source.createdAt) || now,
    updatedAt: now,
  };

  return validateCourse(course).valid ? course : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
