import { describe, expect, it } from "vitest";
import { createDemoCourses } from "../src/domain/course";
import { buildExportFileName, buildExportPayload, parseImportPayload } from "../src/services/transfer";
// @ts-expect-error 服务端模块无类型声明
import { normalizeSettings } from "../server/settings.mjs";

describe("course export/import", () => {
  it("round-trips exported payload", () => {
    const courses = createDemoCourses();
    const payload = buildExportPayload(courses, "2026-05-25");
    const result = parseImportPayload(JSON.stringify(payload));

    expect(result.courses).toHaveLength(courses.length);
    expect(result.semesterStart).toBe("2026-05-25");
    expect(result.skippedCount).toBe(0);
    expect(result.courses[0].name).toBe(courses[0].name);
  });

  it("accepts a bare course array", () => {
    const result = parseImportPayload(JSON.stringify(createDemoCourses()));

    expect(result.courses.length).toBeGreaterThan(0);
    expect(result.semesterStart).toBe("");
  });

  it("skips invalid entries and fills defaults", () => {
    const valid = { name: "导入课", weekday: 1, startPeriod: 1, endPeriod: 2, startWeek: 1, endWeek: 16 };
    const invalid = { name: "", weekday: 9 };
    const result = parseImportPayload(JSON.stringify([valid, invalid]));

    expect(result.courses).toHaveLength(1);
    expect(result.skippedCount).toBe(1);
    expect(result.courses[0].weekType).toBe("all");
    expect(result.courses[0].id).toMatch(/^course_/);
    expect(result.courses[0].color).toBeTruthy();
  });

  it("rejects files without course data", () => {
    expect(() => parseImportPayload("not json")).toThrow("有效的 JSON");
    expect(() => parseImportPayload('{"foo":1}')).toThrow("没有课程数据");
    expect(() => parseImportPayload("[]")).toThrow("有效课程");
  });

  it("builds a dated export file name", () => {
    expect(buildExportFileName(new Date(2026, 6, 8))).toBe("课表-2026-07-08.json");
  });
});

describe("reminder settings normalization", () => {
  const defaults = { examReminderEnabled: true, reminderDaysBefore: [7, 3, 1] };

  it("falls back to defaults for invalid input", () => {
    expect(normalizeSettings(null, defaults)).toEqual(defaults);
    expect(normalizeSettings({ reminderDaysBefore: "bad" }, defaults)).toEqual(defaults);
  });

  it("sanitizes days: dedupe, bounds, sort desc", () => {
    const result = normalizeSettings(
      { examReminderEnabled: false, reminderDaysBefore: [3, 3, -1, 99, 1, 7.5, 14] },
      defaults
    );

    expect(result.examReminderEnabled).toBe(false);
    expect(result.reminderDaysBefore).toEqual([14, 3, 1]);
  });

  it("allows empty day list", () => {
    expect(normalizeSettings({ reminderDaysBefore: [] }, defaults).reminderDaysBefore).toEqual([]);
  });
});
