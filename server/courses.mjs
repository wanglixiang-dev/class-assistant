export function createCourseRepository(db) {
  function listCourses(userId) {
    return db
      .prepare("SELECT payload FROM courses WHERE user_id = ? ORDER BY updated_at DESC")
      .all(userId)
      .map((row) => JSON.parse(row.payload));
  }

  function upsertCourse(userId, course) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO courses (id, user_id, payload, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id, user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`
    ).run(course.id, userId, JSON.stringify(course), now);
    return course;
  }

  function replaceCourses(userId, courses) {
    const now = new Date().toISOString();
    const replace = db.transaction((items) => {
      db.prepare("DELETE FROM courses WHERE user_id = ?").run(userId);
      const insert = db.prepare("INSERT INTO courses (id, user_id, payload, updated_at) VALUES (?, ?, ?, ?)");
      for (const course of items) {
        insert.run(course.id, userId, JSON.stringify(course), now);
      }
    });

    replace(courses);
    return courses;
  }

  function deleteCourse(userId, courseId) {
    db.prepare("DELETE FROM courses WHERE user_id = ? AND id = ?").run(userId, courseId);
  }

  return { deleteCourse, listCourses, replaceCourses, upsertCourse };
}
