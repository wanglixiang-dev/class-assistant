<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { ReminderSettings } from "../services/api";
import { fetchReminderSettings, saveReminderSettings } from "../services/api";
import { useAuthStore } from "../stores/authStore";

const authStore = useAuthStore();
const dayOptions = [1, 3, 7, 14];

const settings = ref<ReminderSettings>({ examReminderEnabled: true, reminderDaysBefore: [7, 3, 1] });
const loading = ref(true);
const saving = ref(false);
const message = ref("");
const error = ref("");

onMounted(async () => {
  try {
    settings.value = await fetchReminderSettings();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "设置读取失败";
  } finally {
    loading.value = false;
  }
});

function toggleDay(day: number): void {
  const days = settings.value.reminderDaysBefore;
  settings.value.reminderDaysBefore = days.includes(day)
    ? days.filter((item) => item !== day)
    : [...days, day].sort((a, b) => b - a);
}

async function save(): Promise<void> {
  saving.value = true;
  message.value = "";
  error.value = "";

  try {
    settings.value = await saveReminderSettings(settings.value);
    message.value = "设置已保存";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "设置保存失败";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section aria-labelledby="settingsTitle">
    <header class="topbar compact">
      <h2 id="settingsTitle">提醒设置</h2>
      <RouterLink class="secondary-button link-button" :to="{ name: 'schedule' }">返回</RouterLink>
    </header>

    <div v-if="!authStore.user" class="empty-state">
      <h3>请先登录</h3>
      <p>考试提醒会发送到登录邮箱</p>
      <RouterLink class="primary-button link-button" :to="{ name: 'login' }">邮箱登录</RouterLink>
    </div>

    <form v-else class="course-form login-form" novalidate @submit.prevent="save">
      <p class="settings-hint">考试前会发送邮件提醒到 {{ authStore.user.email }}</p>

      <label class="switch-field">
        <input v-model="settings.examReminderEnabled" type="checkbox" :disabled="loading" />
        <span>开启考试提醒</span>
      </label>

      <div class="field">
        <span>提前提醒</span>
        <div class="chip-group">
          <button
            v-for="day in dayOptions"
            :key="day"
            type="button"
            class="chip"
            :class="{ active: settings.reminderDaysBefore.includes(day) }"
            :disabled="loading || !settings.examReminderEnabled"
            @click="toggleDay(day)"
          >
            {{ day }} 天
          </button>
        </div>
      </div>

      <div v-if="error" class="form-warning">{{ error }}</div>
      <div v-if="message" class="settings-saved">{{ message }}</div>

      <div class="form-actions">
        <button class="primary-button" type="submit" :disabled="loading || saving">保存</button>
      </div>
    </form>
  </section>
</template>
