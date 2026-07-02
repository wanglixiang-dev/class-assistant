<script setup lang="ts">
import { useRouter } from "vue-router";
import { useCourseStore } from "./stores/courseStore";

const store = useCourseStore();
const router = useRouter();

function resetDemoData(): void {
  if (!window.confirm("恢复演示数据会覆盖当前本地课程，是否继续？")) return;
  store.resetDemoData();
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

      <div class="sidebar-section">
        <div class="section-title">快捷操作</div>
        <button class="ghost-action" type="button" @click="resetDemoData">恢复演示数据</button>
      </div>
    </aside>

    <main class="main-panel">
      <RouterView />
    </main>
  </div>
</template>
