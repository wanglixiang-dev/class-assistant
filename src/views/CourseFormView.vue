<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { CourseInput, CourseValidationResult } from "../domain/course";
import { maxWeek, periods, weekdays } from "../domain/week";
import { useCourseStore } from "../stores/courseStore";

const route = useRoute();
const router = useRouter();
const store = useCourseStore();
const warning = ref("");
const errors = ref<CourseValidationResult["errors"]>({});

const editingId = computed(() => (typeof route.params.id === "string" ? route.params.id : ""));
const editingCourse = computed(() => (editingId.value ? store.getCourseById(editingId.value) : undefined));
const isEditing = computed(() => Boolean(editingId.value));

const form = reactive<CourseInput>({
  id: "",
  name: "",
  teacher: "",
  classroom: "",
  weekday: 0,
  startPeriod: 0,
  endPeriod: 0,
  startWeek: store.currentWeek,
  endWeek: Math.min(store.currentWeek + 15, maxWeek),
  color: "",
  homework: "",
  examDate: "",
  note: "",
  locationName: "",
  locationAddress: "",
  longitude: null,
  latitude: null,
  createdAt: "",
});

watchEffect(() => {
  if (!editingId.value) {
    resetForm();
    return;
  }

  const course = editingCourse.value;
  if (!course) return;
  Object.assign(form, course);
});

function resetForm(): void {
  Object.assign(form, {
    id: "",
    name: "",
    teacher: "",
    classroom: "",
    weekday: 0,
    startPeriod: 0,
    endPeriod: 0,
    startWeek: store.currentWeek,
    endWeek: Math.min(store.currentWeek + 15, maxWeek),
    color: "",
    homework: "",
    examDate: "",
    note: "",
    locationName: "",
    locationAddress: "",
    longitude: null,
    latitude: null,
    createdAt: "",
  });
  errors.value = {};
  warning.value = "";
}

function goBack(): void {
  if (isEditing.value && editingId.value) {
    router.push({ name: "course-detail", params: { id: editingId.value } });
    return;
  }
  router.push({ name: "schedule" });
}

async function save(): Promise<void> {
  warning.value = "";
  const result = store.validate(form);
  errors.value = result.errors;
  if (!result.valid) return;

  const conflicts = store.getConflicts(form);
  if (conflicts.length > 0) {
    const names = conflicts.map((course) => course.name).join("、");
    const confirmed = window.confirm(`该课程与「${names}」存在时间冲突，是否继续保存？`);
    if (!confirmed) {
      warning.value = "已保留表单内容，请调整星期、节次或周次。";
      return;
    }
  }

  const saved = await store.saveCourse(form);
  router.push({ name: "course-detail", params: { id: saved.id } });
}
</script>

<template>
  <section class="view active" aria-labelledby="formTitle">
    <header class="topbar compact">
      <div>
        <p class="eyebrow">课程管理</p>
        <h2 id="formTitle">{{ isEditing ? "编辑课程" : "添加课程" }}</h2>
      </div>
      <button class="secondary-button" type="button" @click="goBack">返回</button>
    </header>

    <div v-if="isEditing && !editingCourse" class="empty-state">
      <h3>课程不存在</h3>
      <p>该课程可能已被删除。</p>
      <RouterLink class="primary-button link-button" :to="{ name: 'schedule' }">返回周视图</RouterLink>
    </div>

    <form v-else class="course-form" novalidate @submit.prevent="save">
      <div class="form-grid">
        <label class="field full">
          <span>课程名 *</span>
          <input v-model.trim="form.name" maxlength="30" placeholder="例如：高等数学" />
          <small class="field-error">{{ errors.name }}</small>
        </label>

        <label class="field">
          <span>教师</span>
          <input v-model.trim="form.teacher" maxlength="20" placeholder="例如：王老师" />
        </label>

        <label class="field">
          <span>教室</span>
          <input v-model.trim="form.classroom" maxlength="30" placeholder="例如：教学楼 A101" />
        </label>

        <label class="field">
          <span>星期 *</span>
          <select v-model.number="form.weekday">
            <option :value="0">请选择星期</option>
            <option v-for="(day, index) in weekdays" :key="day" :value="index + 1">{{ day }}</option>
          </select>
          <small class="field-error">{{ errors.weekday }}</small>
        </label>

        <label class="field">
          <span>开始节次 *</span>
          <select v-model.number="form.startPeriod">
            <option :value="0">开始节次</option>
            <option v-for="period in periods" :key="period" :value="period">第 {{ period }} 节</option>
          </select>
          <small class="field-error">{{ errors.period }}</small>
        </label>

        <label class="field">
          <span>结束节次 *</span>
          <select v-model.number="form.endPeriod">
            <option :value="0">结束节次</option>
            <option v-for="period in periods" :key="period" :value="period">第 {{ period }} 节</option>
          </select>
        </label>

        <label class="field">
          <span>开始周 *</span>
          <input v-model.number="form.startWeek" type="number" min="1" :max="maxWeek" placeholder="1" />
          <small class="field-error">{{ errors.week }}</small>
        </label>

        <label class="field">
          <span>结束周 *</span>
          <input v-model.number="form.endWeek" type="number" min="1" :max="maxWeek" placeholder="16" />
        </label>

        <label class="field full">
          <span>作业</span>
          <textarea v-model.trim="form.homework" rows="3" placeholder="例如：完成第 3 章课后习题" />
        </label>

        <label class="field">
          <span>考试日期</span>
          <input v-model="form.examDate" type="date" />
          <small class="field-error">{{ errors.examDate }}</small>
        </label>

        <label class="field full">
          <span>备注</span>
          <textarea v-model.trim="form.note" rows="3" placeholder="例如：需要带教材和练习册" />
        </label>
      </div>

      <div v-if="warning" class="form-warning">{{ warning }}</div>

      <div class="form-actions">
        <button class="secondary-button" type="button" @click="resetForm">清空</button>
        <button class="primary-button" type="submit">保存课程</button>
      </div>
    </form>
  </section>
</template>
