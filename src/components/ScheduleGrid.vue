<script setup lang="ts">
import type { Course } from "../domain/course";
import { periods, weekdays } from "../domain/week";
import CourseCard from "./CourseCard.vue";

defineProps<{
  courses: Course[];
  conflictIds: Set<string>;
}>();
</script>

<template>
  <div class="schedule-wrap">
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
</template>
