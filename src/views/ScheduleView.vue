<script setup lang="ts">
import { computed } from "vue";
import ScheduleGrid from "../components/ScheduleGrid.vue";
import { getWeekdayOfDate } from "../domain/week";
import { useCourseStore } from "../stores/courseStore";

const store = useCourseStore();

const conflictCount = computed(() => store.conflictIds.size);
const awayFromToday = computed(() => store.todayWeek !== null && store.todayWeek !== store.currentWeek);
// 未设置开学日期时视为正在查看当前周
const todayWeekday = computed(() => (awayFromToday.value ? null : getWeekdayOfDate(new Date())));
</script>

<template>
  <section aria-labelledby="scheduleTitle">
    <header class="topbar">
      <h2 id="scheduleTitle">第 {{ store.currentWeek }} 周</h2>
      <div class="toolbar week-toolbar">
        <button class="icon-button" type="button" aria-label="上一周" @click="store.previousWeek">‹</button>
        <button class="icon-button" type="button" aria-label="下一周" @click="store.nextWeek">›</button>
        <button v-if="awayFromToday" class="secondary-button" type="button" @click="store.goToCurrentWeek">本周</button>
        <RouterLink class="primary-button link-button" :to="{ name: 'course-new' }">+ 添加课程</RouterLink>
      </div>
    </header>

    <div v-if="store.lastStorageError" class="conflict-banner">{{ store.lastStorageError }}</div>
    <div v-if="conflictCount > 0" class="conflict-banner">本周有 {{ conflictCount }} 门课程时间冲突</div>

    <ScheduleGrid :courses="store.weekCourses" :conflict-ids="store.conflictIds" :today-weekday="todayWeekday" />

    <div v-if="store.weekCourses.length === 0" class="empty-state">
      <h3>本周暂无课程</h3>
      <p>点击「添加课程」开始安排</p>
    </div>
  </section>
</template>
