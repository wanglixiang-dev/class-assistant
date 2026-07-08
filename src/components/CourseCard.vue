<script setup lang="ts">
import { computed } from "vue";
import type { Course } from "../domain/course";

const props = defineProps<{
  course: Course;
  conflicted: boolean;
  ongoing?: boolean;
}>();

const meta = computed(() => [props.course.classroom, props.course.teacher].filter(Boolean).join(" · "));
</script>

<template>
  <RouterLink
    class="course-block"
    :class="{ conflict: conflicted, ongoing }"
    :style="{
      gridColumn: String(course.weekday + 1),
      gridRow: `${course.startPeriod + 1} / span ${course.endPeriod - course.startPeriod + 1}`,
      background: course.color,
    }"
    :to="{ name: 'course-detail', params: { id: course.id } }"
  >
    <div>
      <div class="course-title">{{ course.name }}</div>
      <div v-if="meta" class="course-meta">{{ meta }}</div>
    </div>
    <div v-if="conflicted" class="conflict-tag">冲突</div>
  </RouterLink>
</template>
