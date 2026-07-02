import type { Course } from "./course";
import { getCoursesForWeek } from "./week";

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function isCourseConflict(a: Course, b: Course): boolean {
  if (a.id === b.id) return false;
  return (
    a.weekday === b.weekday &&
    rangesOverlap(a.startWeek, a.endWeek, b.startWeek, b.endWeek) &&
    rangesOverlap(a.startPeriod, a.endPeriod, b.startPeriod, b.endPeriod)
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
