import { defineStore } from "pinia";
import { ref } from "vue";
import {
  clearAuthToken,
  fetchCurrentUser,
  getAuthToken,
  requestLoginCode,
  setAuthToken,
  type AuthUser,
  verifyLoginCode,
} from "../services/api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);
  const error = ref("");
  const loginCodeSent = ref(false);

  async function initialize(): Promise<void> {
    if (!getAuthToken()) return;
    loading.value = true;
    error.value = "";

    try {
      user.value = await fetchCurrentUser();
    } catch {
      clearAuthToken();
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function sendLoginCode(email: string): Promise<void> {
    loading.value = true;
    error.value = "";

    try {
      await requestLoginCode(email);
      loginCodeSent.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "验证码发送失败";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, code: string): Promise<void> {
    loading.value = true;
    error.value = "";

    try {
      const result = await verifyLoginCode(email, code);
      setAuthToken(result.token);
      user.value = result.user;
      loginCodeSent.value = false;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "登录失败";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function logout(): void {
    clearAuthToken();
    user.value = null;
    loginCodeSent.value = false;
    error.value = "";
  }

  return {
    error,
    loading,
    loginCodeSent,
    user,
    initialize,
    login,
    logout,
    sendLoginCode,
  };
});
