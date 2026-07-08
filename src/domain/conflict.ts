import type { Course } from "./course";
import { getCoursesForWeek, matchesWeekType } from "./week";

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** 两门课的周范围内是否存在同时上课的周（考虑单双周） */
function weeksCanCoincide(a: Course, b: Course): boolean {
  const start = Math.max(a.startWeek, b.startWeek);
  const end = Math.min(a.endWeek, b.endWeek);
  for (let week = start; week <= end; week += 1) {
    if (matchesWeekType(a, week) && matchesWeekType(b, week)) return true;
  }
  return false;
}

export function isCourseConflict(a: Course, b: Course): boolean {
  if (a.id === b.id) return false;
  return (
    a.weekday === b.weekday &&
    rangesOverlap(a.startPeriod, a.endPeriod, b.startPeriod, b.endPeriod) &&
    weeksCanCoincide(a, b)
  );
}

export function detectConflicts(courses: Course[], targetCourse: Course): Course[] {
  return courses.filter((course) => isCourseConflict(course, targetCourse));
}

export function getConflictIdsForWeek(courses: Course[], week: number): Set<string> {
  const weekCourses = getCoursesForWeek(courses, week);
  const ids = new Set<string>();

  weekCourses.forEach((course) => {
    weekCourses.forEach((other) => {
      if (
        course.id !== other.id &&
        course.weekday === other.weekday &&
        rangesOverlap(course.startPeriod, course.endPeriod, other.startPeriod, other.endPeriod)
      ) {
        ids.add(course.id);
        ids.add(other.id);
      }
    });
  });

  return ids;
}
