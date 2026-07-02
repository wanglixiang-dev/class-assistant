<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { formatPeriod, formatWeek, weekdays } from "../domain/week";
import { buildAmapNavigationUrl, hasNavigableLocation } from "../services/amap";
import { useCourseStore } from "../stores/courseStore";

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const store = useCourseStore();
const confirmDeleteOpen = ref(false);
const course = computed(() => store.getCourseById(props.id));

async function resolveCurrentCourseLocation(): Promise<void> {
  if (!course.value || !course.value.classroom || (course.value.longitude && course.value.latitude)) return;
  await store.resolveCourseLocation(course.value.id);
}

onMounted(resolveCurrentCourseLocation);
watch(() => props.id, resolveCurrentCourseLocation);

function openNavigation(): void {
  if (!course.value || !hasNavigableLocation(course.value)) return;

  if (!navigator.geolocation) {
    window.open(buildAmapNavigationUrl(course.value), "_blank", "noopener,noreferrer");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (!course.value) return;
      window.open(
        buildAmapNavigationUrl(course.value, {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        }),
        "_blank",
        "noopener,noreferrer"
      );
    },
    () => {
      if (!course.value) return;
      window.open(buildAmapNavigationUrl(course.value), "_blank", "noopener,noreferrer");
    },
    { enableHighAccuracy: false, timeout: 2000 }
  );
}

function deleteCourse(): void {
  store.deleteCourse(props.id);
  confirmDeleteOpen.value = false;
  router.push({ name: "schedule" });
}
</script>

<template>
  <section class="view active" aria-labelledby="detailTitle">
    <header class="topbar compact">
      <div>
        <p class="eyebrow">课程详情</p>
        <h2 id="detailTitle">{{ course?.name || "课程详情" }}</h2>
      </div>
      <div class="toolbar">
        <RouterLink class="secondary-button link-button" :to="{ name: 'schedule' }">返回</RouterLink>
        <RouterLink
          v-if="course"
          class="secondary-button link-button"
          :to="{ name: 'course-edit', params: { id: course.id } }"
        >
          编辑
        </RouterLink>
        <button v-if="course" class="danger-button" type="button" @click="confirmDeleteOpen = true">删除</button>
      </div>
    </header>

    <div v-if="!course" class="empty-state">
      <h3>课程不存在</h3>
      <p>该课程可能已被删除。</p>
    </div>

    <div v-else class="detail-layout">
      <div class="detail-main">
        <div class="detail-title-row">
          <h3>{{ course.name }}</h3>
          <span class="color-dot" :style="{ background: course.color }" />
        </div>
        <div class="info-list">
          <div class="info-item">
            <div class="info-label">教师</div>
            <div class="info-value">{{ course.teacher || "暂无教师信息" }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">教室</div>
            <div class="info-value">{{ course.classroom || "暂无教室信息" }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">时间</div>
            <div class="info-value">{{ weekdays[course.weekday - 1] }} {{ formatPeriod(course) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">周次</div>
            <div class="info-value">{{ formatWeek(course) }}</div>
          </div>
        </div>
      </div>

      <aside class="detail-side">
        <div v-if="hasNavigableLocation(course)" class="nav-box">
          <h4>上课地点导航</h4>
          <p>
            {{ course.locationName || course.classroom }} ·
            {{
              course.longitude && course.latitude
                ? course.locationAddress || "已解析精确坐标"
                : store.lastLocationResolveMessage || "当前为搜索模式，接入高德 API 后可精确到坐标"
            }}
          </p>
          <button class="primary-button" type="button" @click="openNavigation">在高德地图搜索</button>
        </div>
        <div v-else class="nav-box">
          <h4>上课地点导航</h4>
          <p>当前教室未填写或无法解析为可导航地点。</p>
        </div>

        <div class="text-box">
          <h4>作业</h4>
          <p>{{ course.homework || "暂无作业" }}</p>
        </div>
        <div class="text-box">
          <h4>考试日期</h4>
          <p>{{ course.examDate || "暂无考试日期" }}</p>
        </div>
        <div class="text-box">
          <h4>备注</h4>
          <p>{{ course.note || "暂无备注" }}</p>
        </div>
      </aside>
    </div>

    <ConfirmDialog
      :open="confirmDeleteOpen"
      title="删除课程"
      :message="`确认删除「${course?.name || ''}」吗？删除后不可在详情页继续访问。`"
      confirm-text="删除"
      @cancel="confirmDeleteOpen = false"
      @confirm="deleteCourse"
    />
  </section>
</template>
