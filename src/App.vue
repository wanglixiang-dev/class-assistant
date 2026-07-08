<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { buildExportFileName, buildExportPayload, parseImportPayload } from "./services/transfer";
import { useAuthStore } from "./stores/authStore";
import { useCourseStore } from "./stores/courseStore";

const authStore = useAuthStore();
const store = useCourseStore();
const router = useRouter();
const importInput = ref<HTMLInputElement>();

onMounted(async () => {
  await authStore.initialize();
  if (authStore.user) {
    await store.loadRemoteCourses();
  }
});

async function resetDemoData(): Promise<void> {
  if (!window.confirm("恢复演示数据会覆盖当前本地课程，是否继续？")) return;
  await store.resetDemoData();
  router.push({ name: "schedule" });
}

function logout(): void {
  authStore.logout();
  store.useLocalCourses();
  router.push({ name: "schedule" });
}

function onSemesterStartChange(event: Event): void {
  store.setSemesterStart((event.target as HTMLInputElement).value);
}

function exportCourses(): void {
  const payload = buildExportPayload(store.courses, store.semesterStart);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildExportFileName();
  link.click();
  URL.revokeObjectURL(url);
}

async function onImportFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  try {
    const result = parseImportPayload(await file.text());
    const skipped = result.skippedCount > 0 ? `，${result.skippedCount} 条无效数据将被跳过` : "";
    if (!window.confirm(`导入 ${result.courses.length} 门课程并覆盖当前课表${skipped}，是否继续？`)) return;

    await store.importCourses(result.courses, result.semesterStart);
    router.push({ name: "schedule" });
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "导入失败");
  }
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" aria-label="应用信息">
      <div class="brand">
        <div class="brand-mark">课</div>
        <h1>课表助手</h1>
      </div>

      <label class="sidebar-field">
        <span>开学日期</span>
        <input type="date" :value="store.semesterStart" @change="onSemesterStartChange" />
      </label>

      <div class="sidebar-section sidebar-actions">
        <div v-if="authStore.user" class="account-chip">{{ authStore.user.email }}</div>
        <RouterLink v-else class="ghost-action link-button" :to="{ name: 'login' }">邮箱登录</RouterLink>
        <RouterLink v-if="authStore.user" class="ghost-action link-button" :to="{ name: 'settings' }">提醒设置</RouterLink>
        <button class="ghost-action" type="button" @click="exportCourses">导出课表</button>
        <button class="ghost-action" type="button" @click="importInput?.click()">导入课表</button>
        <input ref="importInput" type="file" accept=".json,application/json" hidden @change="onImportFileChange" />
        <button v-if="authStore.user" class="ghost-action" type="button" @click="logout">退出登录</button>
        <button v-if="!authStore.user" class="ghost-action" type="button" @click="resetDemoData">恢复演示数据</button>
      </div>
    </aside>

    <main class="main-panel">
      <RouterView />
    </main>
  </div>
</template>
