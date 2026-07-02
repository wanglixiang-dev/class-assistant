<script setup lang="ts">
import type { Course } from "../domain/course";

defineProps<{
  course: Course;
  conflicted: boolean;
}>();
</script>

<template>
  <RouterLink
    class="course-block"
    :class="{ conflict: conflicted }"
    :style="{
      gridColumn: String(course.weekday + 1),
      gridRow: `${course.startPeriod + 1} / span ${course.endPeriod - course.startPeriod + 1}`,
      background: course.color,
    }"
    :to="{ name: 'course-detail', params: { id: course.id } }"
  >
    <div>
      <div class="course-title">{{ course.name }}</div>
      <div class="course-meta">{{ course.classroom || "暂无教室" }} · {{ course.teacher || "暂无教师" }}</div>
    </div>
    <div v-if="conflicted" class="conflict-tag">时间冲突</div>
  </RouterLink>
</template>
