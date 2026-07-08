import type { Course } from "./course";

export const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
export const periods = Array.from({ length: 12 }, (_, index) => index + 1);
export const maxWeek = 20;

export interface PeriodTime {
  start: string;
  end: string;
}

export const periodTimes: PeriodTime[] = [
  { start: "08:00", end: "08:45" },
  { start: "08:55", end: "09:40" },
  { start: "10:00", end: "10:45" },
  { start: "10:55", end: "11:40" },
  { start: "14:00", end: "14:45" },
  { start: "14:55", end: "15:40" },
  { start: "16:00", end: "16:45" },
  { start: "16:55", end: "17:40" },
  { start: "19:00", end: "19:45" },
  { start: "19:55", end: "20:40" },
  { start: "20:50", end: "21:35" },
  { start: "21:45", end: "22:30" },
];

export function matchesWeekType(course: Pick<Course, "weekType">, week: number): boolean {
  if (course.weekType === "odd") return week % 2 === 1;
  if (course.weekType === "even") return week % 2 === 0;
  return true;
}

export function isCourseInWeek(course: Course, week: number): boolean {
  return week >= course.startWeek && week <= course.endWeek && matchesWeekType(course, week);
}

export function getCoursesForWeek(courses: Course[], week: number): Course[] {
  return courses
    .filter((course) => isCourseInWeek(course, week))
    .sort((a, b) => a.weekday - b.weekday || a.startPeriod - b.startPeriod);
}

export function formatPeriod(course: Pick<Course, "startPeriod" | "endPeriod">): string {
  return `第 ${course.startPeriod}-${course.endPeriod} 节`;
}

export function formatWeek(course: Pick<Course, "startWeek" | "endWeek" | "weekType">): string {
  const base = `第 ${course.startWeek}-${course.endWeek} 周`;
  if (course.weekType === "odd") return `${base}（单周）`;
  if (course.weekType === "even") return `${base}（双周）`;
  return base;
}

/** 周一为 1，周日为 7 */
export function getWeekdayOfDate(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfSchoolWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - (getWeekdayOfDate(result) - 1));
  return result;
}

/** 根据开学日期计算某天属于第几周，开学日期所在周为第 1 周 */
export function getWeekForDate(semesterStart: string, date: Date = new Date()): number | null {
  const start = parseLocalDate(semesterStart);
  if (!start) return null;

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((startOfSchoolWeek(date).getTime() - startOfSchoolWeek(start).getTime()) / dayMs);
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), maxWeek);
}

/** 当前时间正处于第几节课，不在上课时间则返回 null */
export function getCurrentPeriod(date: Date = new Date()): number | null {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const index = periodTimes.findIndex(({ start, end }) => minutes >= toMinutes(start) && minutes <= toMinutes(end));
  return index >= 0 ? index + 1 : null;
}

function toMinutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}
