<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useCourseStore } from "../stores/courseStore";

const authStore = useAuthStore();
const courseStore = useCourseStore();
const router = useRouter();
const message = ref("");

const form = reactive({
  email: "",
  code: "",
});

async function sendCode(): Promise<void> {
  message.value = "";
  await authStore.sendLoginCode(form.email);
  message.value = "验证码已发送，请查看邮箱。";
}

async function login(): Promise<void> {
  message.value = "";
  await authStore.login(form.email, form.code);
  await courseStore.loadRemoteCourses();
  router.push({ name: "schedule" });
}
</script>

<template>
  <section aria-labelledby="loginTitle">
    <header class="topbar compact">
      <h2 id="loginTitle">邮箱登录</h2>
      <RouterLink class="secondary-button link-button" :to="{ name: 'schedule' }">返回</RouterLink>
    </header>

    <form class="course-form login-form" novalidate @submit.prevent="login">
      <div class="form-grid">
        <label class="field full">
          <span>邮箱</span>
          <input v-model.trim="form.email" type="email" autocomplete="email" placeholder="name@example.com" />
        </label>

        <label class="field full">
          <span>验证码</span>
          <input v-model.trim="form.code" inputmode="numeric" maxlength="6" placeholder="6 位验证码" />
        </label>
      </div>

      <div v-if="authStore.error" class="form-warning">{{ authStore.error }}</div>
      <div v-if="message" class="conflict-banner">{{ message }}</div>

      <div class="form-actions">
        <button class="secondary-button" type="button" :disabled="authStore.loading" @click="sendCode">
          获取验证码
        </button>
        <button class="primary-button" type="submit" :disabled="authStore.loading">登录</button>
      </div>
    </form>
  </section>
</template>
