import type { Course } from "../domain/course";
import { createDemoCourses } from "../domain/course";

const STORAGE_KEY = "class-assistant-courses";
const LEGACY_STORAGE_KEY = "class-assistant-prototype-courses";
const WEEK_KEY = "class-assistant-week";
const LEGACY_WEEK_KEY = "class-assistant-prototype-week";

export function loadCourses(): Course[] {
  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return createDemoCourses();
  }

  try {
    const parsed = JSON.parse(raw) as Course[];
    const courses = migrateCourses(parsed);
    saveCourses(courses);
    return courses;
  } catch {
    return [];
  }
}

export function hasStoredCourses(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY));
}

export function saveCourses(courses: Course[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export function loadCurrentWeek(): number {
  const raw = localStorage.getItem(WEEK_KEY) || localStorage.getItem(LEGACY_WEEK_KEY);
  const week = Number(raw);
  return Number.isFinite(week) && week >= 1 ? week : 3;
}

export function saveCurrentWeek(week: number): void {
  localStorage.setItem(WEEK_KEY, String(week));
}

function migrateCourses(courses: Course[]): Course[] {
  return courses.map((course) => {
    const hasOldDemoCoordinate =
      (course.longitude === 116.397428 && course.latitude === 39.90923) ||
      (course.longitude === 116.40021 && course.latitude === 39.91012) ||
      (course.longitude === 116.39555 && course.latitude === 39.90888);

    return {
      ...course,
      locationName: course.locationName || "",
      locationAddress: course.locationAddress || "",
      longitude: hasOldDemoCoordinate ? null : course.longitude ?? null,
      latitude: hasOldDemoCoordinate ? null : course.latitude ?? null,
    };
  });
}
