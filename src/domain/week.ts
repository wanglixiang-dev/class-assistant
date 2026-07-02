import type { Course } from "./course";

export const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
export const periods = Array.from({ length: 12 }, (_, index) => index + 1);
export const maxWeek = 20;

export function isCourseInWeek(course: Course, week: number): boolean {
  return week >= course.startWeek && week <= course.endWeek;
}

export function getCoursesForWeek(courses: Course[], week: number): Course[] {
  return courses
    .filter((course) => isCourseInWeek(course, week))
    .sort((a, b) => a.weekday - b.weekday || a.startPeriod - b.startPeriod);
}

export function formatPeriod(course: Pick<Course, "startPeriod" | "endPeriod">): string {
  return `第 ${course.startPeriod}-${course.endPeriod} 节`;
}

export function formatWeek(course: Pick<Course, "startWeek" | "endWeek">): string {
  return `第 ${course.startWeek}-${course.endWeek} 周`;
}
