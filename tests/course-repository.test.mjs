import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCourseRepository } from "../server/courses.mjs";
import { openDatabase } from "../server/database.mjs";

const tempDirs = [];

afterEach(() => {
  while (tempDirs.length) {
    rmSync(tempDirs.pop(), { force: true, recursive: true });
  }
});

function createTestRepository() {
  const dir = mkdtempSync(join(tmpdir(), "class-assistant-db-"));
  tempDirs.push(dir);
  const db = openDatabase(join(dir, "test.sqlite"));
  const userId = "user-1";
  db.prepare("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)").run(
    userId,
    "student@example.com",
    new Date().toISOString()
  );

  return { repository: createCourseRepository(db), userId };
}

describe("course repository", () => {
  it("replaces courses using node:sqlite transactions", () => {
    const { repository, userId } = createTestRepository();
    const courses = [
      {
        id: "course-1",
        name: "高等数学",
        weekday: 1,
        startPeriod: 1,
        endPeriod: 2,
      },
      {
        id: "course-2",
        name: "大学英语",
        weekday: 2,
        startPeriod: 3,
        endPeriod: 4,
      },
    ];

    expect(repository.replaceCourses(userId, courses)).toEqual(courses);
    expect(repository.listCourses(userId).map((course) => course.id).sort()).toEqual(["course-1", "course-2"]);
  });
});
