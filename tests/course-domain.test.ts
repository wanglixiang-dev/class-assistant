import { describe, expect, it } from "vitest";
import type { CourseInput, WeekType } from "../src/domain/course";
import { createCourse, createDemoCourses, inferLocationFromClassroom, validateCourse } from "../src/domain/course";
import { detectConflicts } from "../src/domain/conflict";
import { formatWeek, getCoursesForWeek, getWeekForDate } from "../src/domain/week";
import { buildAmapNavigationUrl, resolveAmapPlaces } from "../src/services/amap";

function courseInput(overrides: Partial<CourseInput> & { weekType?: WeekType }): CourseInput {
  return {
    name: "测试课程",
    teacher: "",
    classroom: "",
    weekday: 1,
    startPeriod: 1,
    endPeriod: 2,
    startWeek: 1,
    endWeek: 16,
    homework: "",
    examDate: "",
    note: "",
    locationName: "",
    locationAddress: "",
    longitude: null,
    latitude: null,
    ...overrides,
  };
}

describe("course validation", () => {
  it("rejects empty required fields", () => {
    const result = validateCourse({
      name: "",
      weekday: 0,
      startPeriod: 0,
      endPeriod: 0,
      startWeek: 0,
      endWeek: 0,
      examDate: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe("请输入课程名");
    expect(result.errors.weekday).toBe("请选择星期");
    expect(result.errors.period).toBe("请选择节次");
    expect(result.errors.week).toBe("请输入有效周次");
  });

  it("rejects invalid period and week ranges", () => {
    const result = validateCourse({
      name: "高等数学",
      weekday: 1,
      startPeriod: 4,
      endPeriod: 2,
      startWeek: 12,
      endWeek: 8,
      examDate: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.period).toBe("请输入有效节次");
    expect(result.errors.week).toBe("请输入有效周次");
  });
});

describe("week filtering and conflicts", () => {
  it("filters courses by continuous week range", () => {
    const courses = createDemoCourses();

    expect(getCoursesForWeek(courses, 1).map((course) => course.id)).not.toContain("course_pe");
    expect(getCoursesForWeek(courses, 3).map((course) => course.id)).toContain("course_pe");
  });

  it("detects overlapped weekday, week and period as conflict", () => {
    const math = createCourse(courseInput({ name: "高等数学", startPeriod: 1, endPeriod: 2 }), []);
    const physics = createCourse(courseInput({ name: "大学物理", startPeriod: 2, endPeriod: 3, startWeek: 2, endWeek: 10 }), [math]);
    const courses = [math, physics];

    expect(detectConflicts(courses, math).map((course) => course.id)).toContain(physics.id);
  });

  it("filters odd/even week courses by week parity", () => {
    const oddCourse = createCourse(courseInput({ weekType: "odd" }), []);

    expect(getCoursesForWeek([oddCourse], 3)).toHaveLength(1);
    expect(getCoursesForWeek([oddCourse], 4)).toHaveLength(0);
  });

  it("does not report odd-week and even-week courses as conflict", () => {
    const oddCourse = createCourse(courseInput({ name: "单周实验", weekType: "odd" }), []);
    const evenCourse = createCourse(courseInput({ name: "双周研讨", weekType: "even" }), [oddCourse]);

    expect(detectConflicts([oddCourse, evenCourse], oddCourse)).toHaveLength(0);
  });

  it("reports odd-week course conflicting with weekly course", () => {
    const oddCourse = createCourse(courseInput({ name: "单周实验", weekType: "odd" }), []);
    const weekly = createCourse(courseInput({ name: "每周课" }), [oddCourse]);

    expect(detectConflicts([oddCourse, weekly], weekly).map((course) => course.id)).toContain(oddCourse.id);
  });

  it("labels odd/even weeks in formatWeek", () => {
    expect(formatWeek({ startWeek: 1, endWeek: 16, weekType: "odd" })).toBe("第 1-16 周（单周）");
    expect(formatWeek({ startWeek: 1, endWeek: 16, weekType: "all" })).toBe("第 1-16 周");
  });

  it("keeps demo courses conflict-free", () => {
    const courses = createDemoCourses();

    expect(courses.flatMap((course) => detectConflicts(courses, course))).toHaveLength(0);
  });

  it("computes week number from semester start date", () => {
    // 2026-03-02 是周一
    expect(getWeekForDate("2026-03-02", new Date(2026, 2, 2))).toBe(1);
    expect(getWeekForDate("2026-03-02", new Date(2026, 2, 8))).toBe(1);
    expect(getWeekForDate("2026-03-02", new Date(2026, 2, 9))).toBe(2);
    // 开学日期不是周一时，按所在自然周算第 1 周
    expect(getWeekForDate("2026-03-04", new Date(2026, 2, 2))).toBe(1);
    expect(getWeekForDate("2026-03-04", new Date(2026, 2, 9))).toBe(2);
    // 无效日期
    expect(getWeekForDate("", new Date())).toBeNull();
    // 超出范围时收敛到边界
    expect(getWeekForDate("2026-03-02", new Date(2025, 0, 1))).toBe(1);
    expect(getWeekForDate("2026-03-02", new Date(2027, 0, 1))).toBe(20);
  });

  it("does not report conflicts across different weekdays", () => {
    const courses = createDemoCourses();
    const english = courses.find((course) => course.id === "course_english");

    expect(english).toBeDefined();
    expect(detectConflicts(courses, english!)).toHaveLength(0);
  });
});

describe("location adapter", () => {
  it("uses amap search when course has no coordinate", () => {
    const courses = createDemoCourses();
    const math = courses[0];

    expect(buildAmapNavigationUrl(math)).toContain("uri.amap.com/search");
    expect(buildAmapNavigationUrl(math)).toContain(encodeURIComponent(math.locationName));
  });

  it("infers searchable location from classroom text", () => {
    const location = inferLocationFromClassroom("实验楼 D405");

    expect(location.locationName).toBe("实验楼");
    expect(location.longitude).toBeNull();
  });

  it("returns no places without amap key", async () => {
    await expect(resolveAmapPlaces("教学楼 A101", "")).resolves.toEqual([]);
  });

  it("ignores amap tips with non-string location", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          status: "1",
          tips: [
            { name: "无坐标地点", location: [] },
            { name: "有效地点", address: "校园", location: "116.1,39.9" },
          ],
        }),
        { status: 200 }
      );

    try {
      await expect(resolveAmapPlaces("教学楼 A101", "fake-key")).resolves.toEqual([
        {
          name: "有效地点",
          address: "校园",
          longitude: 116.1,
          latitude: 39.9,
        },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("preserves course color when editing", () => {
    const courses = createDemoCourses();
    const original = courses[0];
    const edited = createCourse(
      {
        ...original,
        name: "高等数学 A",
      },
      courses
    );

    expect(edited.color).toBe(original.color);
  });
});
