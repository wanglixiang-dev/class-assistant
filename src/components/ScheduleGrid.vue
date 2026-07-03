<script setup lang="ts">
import { computed } from "vue";
import type { Course } from "../domain/course";
import { formatPeriod, formatWeek, periods, weekdays } from "../domain/week";
import CourseCard from "./CourseCard.vue";

const props = defineProps<{
  courses: Course[];
  conflictIds: Set<string>;
}>();

const coursesByDay = computed(() =>
  weekdays.map((day, index) => ({
    day,
    courses: props.courses
      .filter((course) => course.weekday === index + 1)
      .sort((a, b) => a.startPeriod - b.startPeriod || a.endPeriod - b.endPeriod),
  }))
);
</script>

<template>
  <div class="schedule-wrap schedule-desktop">
    <div class="schedule-grid" aria-label="周课表">
      <div class="grid-head">节次</div>
      <div v-for="day in weekdays" :key="day" class="grid-head">{{ day }}</div>

      <template v-for="period in periods" :key="period">
        <div class="period-cell" :style="{ gridColumn: '1', gridRow: String(period + 1) }">第 {{ period }} 节</div>
        <div
          v-for="weekday in 7"
          :key="`${period}-${weekday}`"
          class="grid-cell"
          :style="{ gridColumn: String(weekday + 1), gridRow: String(period + 1) }"
        />
      </template>

      <CourseCard
        v-for="course in courses"
        :key="course.id"
        :course="course"
        :conflicted="conflictIds.has(course.id)"
      />
    </div>
  </div>

  <div class="schedule-mobile" aria-label="移动端周课表">
    <section v-for="dayGroup in coursesByDay" :key="dayGroup.day" class="day-section">
      <h3>{{ dayGroup.day }}</h3>

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
            <div class="mobile-course-time">{{ formatPeriod(course) }} · {{ formatWeek(course) }}</div>
            <div class="mobile-course-title">{{ course.name }}</div>
            <div class="mobile-course-meta">{{ course.classroom || "暂无教室" }} · {{ course.teacher || "暂无教师" }}</div>
          </div>
          <span v-if="conflictIds.has(course.id)" class="mobile-conflict-tag">冲突</span>
        </RouterLink>
      </div>

      <p v-else class="mobile-day-empty">暂无课程</p>
    </section>
  </div>
</template>
