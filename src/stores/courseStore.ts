import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Course, CourseInput, CourseValidationResult } from "../domain/course";
import { createCourse, createDemoCourses, inferLocationFromClassroom, validateCourse } from "../domain/course";
import { detectConflicts, getConflictIdsForWeek } from "../domain/conflict";
import { getCoursesForWeek, maxWeek } from "../domain/week";
import { hasAmapApiKey, resolveAmapPlaces } from "../services/amap";
import { deleteRemoteCourse, fetchRemoteCourses, getAuthToken, replaceRemoteCourses, saveRemoteCourse } from "../services/api";
import { loadCourses, loadCurrentWeek, saveCourses, saveCurrentWeek } from "../services/storage";

export const useCourseStore = defineStore("course", () => {
  const courses = ref<Course[]>(loadCourses());
  const currentWeek = ref(loadCurrentWeek());
  const lastStorageError = ref("");
  const lastLocationResolveMessage = ref("");
  const usingRemoteData = ref(false);

  const weekCourses = computed(() => getCoursesForWeek(courses.value, currentWeek.value));
  const conflictIds = computed(() => getConflictIdsForWeek(courses.value, currentWeek.value));

  function persistLocal(): void {
    try {
      saveCourses(courses.value);
      lastStorageError.value = "";
    } catch {
      lastStorageError.value = "本地数据保存失败";
    }
  }

  async function persistCourse(course: Course): Promise<void> {
    persistLocal();
    if (!usingRemoteData.value || !getAuthToken()) return;

    try {
      await saveRemoteCourse(course);
      lastStorageError.value = "";
    } catch (error) {
      lastStorageError.value = `数据库保存失败，已保留本地副本：${formatErrorMessage(error)}`;
    }
  }

  async function loadRemoteCourses(): Promise<void> {
    if (!getAuthToken()) return;

    try {
      const remoteCourses = await fetchRemoteCourses();
      if (remoteCourses.length === 0 && courses.value.length > 0) {
        courses.value = await replaceRemoteCourses(courses.value);
      } else {
        courses.value = remoteCourses;
      }
      usingRemoteData.value = true;
      lastStorageError.value = "";
    } catch (error) {
      usingRemoteData.value = false;
      lastStorageError.value = `数据库读取失败，当前显示本地课程：${formatErrorMessage(error)}`;
    }
  }

  function useLocalCourses(): void {
    courses.value = loadCourses();
    usingRemoteData.value = false;
    lastStorageError.value = "";
  }

  function setCurrentWeek(week: number): void {
    currentWeek.value = Math.min(Math.max(week, 1), maxWeek);
    saveCurrentWeek(currentWeek.value);
  }

  function previousWeek(): void {
    setCurrentWeek(currentWeek.value - 1);
  }

  function nextWeek(): void {
    setCurrentWeek(currentWeek.value + 1);
  }

  function getCourseById(id: string): Course | undefined {
    return courses.value.find((course) => course.id === id);
  }

  function buildCourse(input: CourseInput): Course {
    const existing = input.id ? getCourseById(input.id) : undefined;
    const inferredLocation =
      input.longitude && input.latitude
        ? {
            locationName: input.locationName,
            locationAddress: input.locationAddress,
            longitude: input.longitude,
            latitude: input.latitude,
          }
        : existing && existing.classroom === input.classroom && existing.longitude && existing.latitude
          ? {
              locationName: existing.locationName,
              locationAddress: existing.locationAddress,
              longitude: existing.longitude,
              latitude: existing.latitude,
            }
          : inferLocationFromClassroom(input.classroom);

    return createCourse(
      {
        ...input,
        ...inferredLocation,
        color: existing?.color || input.color,
        createdAt: existing?.createdAt || input.createdAt,
      },
      courses.value
    );
  }

  async function resolveLocationInput(input: CourseInput): Promise<CourseInput> {
    const keyword = input.classroom.trim();
    if (!keyword) {
      lastLocationResolveMessage.value = "未填写教室，无法解析地点";
      return {
        ...input,
        locationName: "",
        locationAddress: "",
        longitude: null,
        latitude: null,
      };
    }

    if (!hasAmapApiKey()) {
      lastLocationResolveMessage.value = "未读取到 VITE_AMAP_KEY，当前使用高德关键词搜索模式";
      return {
        ...input,
        ...inferLocationFromClassroom(keyword),
      };
    }

    const existing = input.id ? getCourseById(input.id) : undefined;
    if (existing && existing.classroom === keyword && existing.longitude && existing.latitude) {
      lastLocationResolveMessage.value = "已使用本地保存的高德坐标";
      return {
        ...input,
        locationName: existing.locationName,
        locationAddress: existing.locationAddress,
        longitude: existing.longitude,
        latitude: existing.latitude,
      };
    }

    try {
      const places = await resolveAmapPlaces(keyword);
      const place = places[0];
      if (!place) {
        lastLocationResolveMessage.value = "高德 API 未返回可用坐标，当前使用关键词搜索模式";
        return {
          ...input,
          ...inferLocationFromClassroom(keyword),
        };
      }

      lastLocationResolveMessage.value = "已通过高德 API 解析到精确坐标";
      return {
        ...input,
        locationName: place.name,
        locationAddress: place.address,
        longitude: place.longitude,
        latitude: place.latitude,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      lastLocationResolveMessage.value = `${message}，当前使用关键词搜索模式`;
      return {
        ...input,
        ...inferLocationFromClassroom(keyword),
      };
    }
  }

  function buildCourseWithResolvedLocation(input: CourseInput): Course {
    const existing = input.id ? getCourseById(input.id) : undefined;
    const location =
      input.longitude && input.latitude
        ? {
            locationName: input.locationName,
            locationAddress: input.locationAddress,
            longitude: input.longitude,
            latitude: input.latitude,
          }
        : existing && existing.classroom === input.classroom && existing.longitude && existing.latitude
        ? {
            locationName: existing.locationName,
            locationAddress: existing.locationAddress,
            longitude: existing.longitude,
            latitude: existing.latitude,
          }
        : {
            locationName: input.locationName,
            locationAddress: input.locationAddress,
            longitude: input.longitude,
            latitude: input.latitude,
          };

    return createCourse(
      {
        ...input,
        ...location,
        color: existing?.color || input.color,
        createdAt: existing?.createdAt || input.createdAt,
      },
      courses.value
    );
  }

  function validate(input: CourseInput): CourseValidationResult {
    const course = buildCourse(input);
    return validateCourse(course);
  }

  function getConflicts(input: CourseInput): Course[] {
    return detectConflicts(courses.value, buildCourse(input));
  }

  async function saveCourse(input: CourseInput): Promise<Course> {
    const resolvedInput = await resolveLocationInput(input);
    const course = buildCourseWithResolvedLocation(resolvedInput);
    const index = courses.value.findIndex((item) => item.id === course.id);
    if (index >= 0) {
      courses.value[index] = course;
    } else {
      courses.value.push(course);
    }
    await persistCourse(course);
    return course;
  }

  async function resolveCourseLocation(id: string): Promise<void> {
    const course = getCourseById(id);
    if (!course || !course.classroom || (course.longitude && course.latitude)) return;

    const resolvedInput = await resolveLocationInput(course);
    const resolvedCourse = buildCourseWithResolvedLocation(resolvedInput);
    const index = courses.value.findIndex((item) => item.id === id);
    if (index < 0) return;

    courses.value[index] = resolvedCourse;
    await persistCourse(resolvedCourse);
  }

  async function deleteCourse(id: string): Promise<void> {
    courses.value = courses.value.filter((course) => course.id !== id);
    persistLocal();

    if (!usingRemoteData.value || !getAuthToken()) return;
    try {
      await deleteRemoteCourse(id);
      lastStorageError.value = "";
    } catch (error) {
      lastStorageError.value = `数据库删除失败，请稍后重试：${formatErrorMessage(error)}`;
    }
  }

  async function resetDemoData(): Promise<void> {
    courses.value = createDemoCourses();
    currentWeek.value = 3;
    persistLocal();
    saveCurrentWeek(currentWeek.value);

    if (!usingRemoteData.value || !getAuthToken()) return;
    try {
      await replaceRemoteCourses(courses.value);
      lastStorageError.value = "";
    } catch (error) {
      lastStorageError.value = `数据库保存失败，已保留本地副本：${formatErrorMessage(error)}`;
    }
  }

  return {
    courses,
    currentWeek,
    weekCourses,
    conflictIds,
    lastStorageError,
    usingRemoteData,
    previousWeek,
    nextWeek,
    setCurrentWeek,
    lastLocationResolveMessage,
    getCourseById,
    validate,
    getConflicts,
    saveCourse,
    loadRemoteCourses,
    useLocalCourses,
    resolveCourseLocation,
    deleteCourse,
    resetDemoData,
  };
});

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "未知错误";
}
