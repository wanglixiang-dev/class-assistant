<script setup lang="ts">
import { computed } from "vue";
import type { Course } from "../domain/course";
import { formatPeriod, formatWeek, getCurrentPeriod, periods, periodTimes, weekdays } from "../domain/week";
import CourseCard from "./CourseCard.vue";

const props = defineProps<{
  courses: Course[];
  conflictIds: Set<string>;
  todayWeekday: number | null;
}>();

const currentPeriod = getCurrentPeriod();

const coursesByDay = computed(() =>
  weekdays.map((day, index) => ({
    day,
    weekday: index + 1,
    courses: props.courses
      .filter((course) => course.weekday === index + 1)
      .sort((a, b) => a.startPeriod - b.startPeriod || a.endPeriod - b.endPeriod),
  }))
);

function courseMeta(course: Course): string {
  return [course.classroom, course.teacher].filter(Boolean).join(" · ");
}

function isOngoing(course: Course): boolean {
  return (
    course.weekday === props.todayWeekday &&
    currentPeriod !== null &&
    currentPeriod >= course.startPeriod &&
    currentPeriod <= course.endPeriod
  );
}
</script>

<template>
  <div class="schedule-wrap schedule-desktop">
    <div class="schedule-grid" aria-label="周课表">
      <div class="grid-head">节次</div>
      <div v-for="(day, index) in weekdays" :key="day" class="grid-head" :class="{ today: index + 1 === todayWeekday }">
        {{ day }}
      </div>

      <template v-for="period in periods" :key="period">
        <div class="period-cell" :style="{ gridColumn: '1', gridRow: String(period + 1) }">
          <div>第 {{ period }} 节</div>
          <div class="period-time">{{ periodTimes[period - 1].start }}</div>
        </div>
        <div
          v-for="weekday in 7"
          :key="`${period}-${weekday}`"
          class="grid-cell"
          :class="{ 'today-col': weekday === todayWeekday }"
          :style="{ gridColumn: String(weekday + 1), gridRow: String(period + 1) }"
        />
      </template>

      <CourseCard
        v-for="course in courses"
        :key="course.id"
        :course="course"
        :conflicted="conflictIds.has(course.id)"
        :ongoing="isOngoing(course)"
      />
    </div>
  </div>

  <div class="schedule-mobile" aria-label="移动端周课表">
    <section v-for="dayGroup in coursesByDay" :key="dayGroup.day" class="day-section">
      <h3>
        {{ dayGroup.day }}
        <span v-if="dayGroup.weekday === todayWeekday" class="today-tag">今天</span>
      </h3>

      <div v-if="dayGroup.courses.length > 0" class="mobile-course-list">
        <RouterLink
          v-for="course in dayGroup.courses"
          :key="course.id"
          class="mobile-course-card"
          :class="{ conflict: conflictIds.has(course.id) }"
          :style="{ borderLeftColor: course.color }"
          :to="{ name: 'course-detail', params: { id: course.id } }"
        >
          <div>
            <div class="mobile-course-time">
              {{ formatPeriod(course) }} · {{ periodTimes[course.startPeriod - 1].start }}–{{
                periodTimes[course.endPeriod - 1].end
              }}
              · {{ formatWeek(course) }}
            </div>
            <div class="mobile-course-title">{{ course.name }}</div>
            <div v-if="courseMeta(course)" class="mobile-course-meta">{{ courseMeta(course) }}</div>
          </div>
          <span v-if="conflictIds.has(course.id)" class="mobile-conflict-tag">冲突</span>
        </RouterLink>
      </div>

      <p v-else class="mobile-day-empty">暂无课程</p>
    </section>
  </div>
</template>
