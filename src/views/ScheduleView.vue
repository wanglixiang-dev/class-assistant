<script setup lang="ts">
import { computed } from "vue";
import ScheduleGrid from "../components/ScheduleGrid.vue";
import { useCourseStore } from "../stores/courseStore";

const store = useCourseStore();

const conflictCount = computed(() => store.conflictIds.size);
</script>

<template>
  <section class="view active" aria-labelledby="scheduleTitle">
    <header class="topbar">
      <div>
        <p class="eyebrow">周视图</p>
        <h2 id="scheduleTitle">第 {{ store.currentWeek }} 周课表</h2>
      </div>
      <div class="toolbar">
        <button class="icon-button" type="button" aria-label="上一周" @click="store.previousWeek">‹</button>
        <button class="icon-button" type="button" aria-label="下一周" @click="store.nextWeek">›</button>
        <RouterLink class="primary-button link-button" :to="{ name: 'course-new' }">+ 添加课程</RouterLink>
      </div>
    </header>

    <div v-if="store.lastStorageError" class="conflict-banner">{{ store.lastStorageError }}</div>
    <div v-if="conflictCount > 0" class="conflict-banner">
      当前周有 {{ conflictCount }} 门课程存在时间冲突，已在课表中标记。
    </div>

    <ScheduleGrid :courses="store.weekCourses" :conflict-ids="store.conflictIds" />

    <div v-if="store.weekCourses.length === 0" class="empty-state">
      <h3>本周暂无课程</h3>
      <p>添加课程后，会按星期、节次和周次显示在这里。</p>
    </div>
  </section>
</template>
