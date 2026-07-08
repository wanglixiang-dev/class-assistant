import type { Course } from "../domain/course";

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

const TOKEN_KEY = "class-assistant-auth-token";

export function getAuthToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function requestLoginCode(email: string): Promise<void> {
  await apiRequest("/api/auth/request-code", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export async function verifyLoginCode(email: string, code: string): Promise<{ token: string; user: AuthUser }> {
  return apiRequest("/api/auth/verify-code", {
    method: "POST",
    body: { email, code },
    auth: false,
  });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const result = await apiRequest<{ user: AuthUser }>("/api/me");
  return result.user;
}

export async function fetchRemoteCourses(): Promise<Course[]> {
  const result = await apiRequest<{ courses: Course[] }>("/api/courses");
  return result.courses;
}

export async function replaceRemoteCourses(courses: Course[]): Promise<Course[]> {
  const result = await apiRequest<{ courses: Course[] }>("/api/courses", {
    method: "PUT",
    body: { courses },
  });
  return result.courses;
}

export async function saveRemoteCourse(course: Course): Promise<Course> {
  const result = await apiRequest<{ course: Course }>(`/api/courses/${encodeURIComponent(course.id)}`, {
    method: "PUT",
    body: { course },
  });
  return result.course;
}

export async function deleteRemoteCourse(id: string): Promise<void> {
  await apiRequest(`/api/courses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export interface ReminderSettings {
  examReminderEnabled: boolean;
  reminderDaysBefore: number[];
}

export async function fetchReminderSettings(): Promise<ReminderSettings> {
  const result = await apiRequest<{ settings: ReminderSettings }>("/api/settings");
  return result.settings;
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<ReminderSettings> {
  const result = await apiRequest<{ settings: ReminderSettings }>("/api/settings", {
    method: "PUT",
    body: { settings },
  });
  return result.settings;
}

async function apiRequest<T>(path: string, options: { auth?: boolean; body?: unknown; method?: string } = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth !== false) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "请求失败");
  }

  return payload as T;
}
