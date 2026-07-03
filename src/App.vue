<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/authStore";
import { useCourseStore } from "./stores/courseStore";

const authStore = useAuthStore();
const store = useCourseStore();
const router = useRouter();

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
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" aria-label="应用信息">
      <div class="brand">
        <div class="brand-mark">课</div>
        <div>
          <h1>课表助手</h1>
          <p>本地个人课表</p>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-title">当前范围</div>
        <ul class="scope-list">
          <li>V1.0 学生个人课表</li>
          <li>本地保存，无需登录</li>
          <li>每天 12 节，连续周</li>
          <li>冲突允许保存并提示</li>
        </ul>
      </div>

      <div class="sidebar-section sidebar-actions">
        <div class="section-title">快捷操作</div>
        <div v-if="authStore.user" class="account-chip">{{ authStore.user.email }}</div>
        <RouterLink v-else class="ghost-action link-button" :to="{ name: 'login' }">邮箱登录</RouterLink>
        <button v-if="authStore.user" class="ghost-action" type="button" @click="logout">退出登录</button>
        <button class="ghost-action" type="button" @click="resetDemoData">恢复演示数据</button>
      </div>
    </aside>

    <main class="main-panel">
      <RouterView />
    </main>
  </div>
</template>
