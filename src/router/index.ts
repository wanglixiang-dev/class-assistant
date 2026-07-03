import { createRouter, createWebHashHistory } from "vue-router";
import ScheduleView from "../views/ScheduleView.vue";
import CourseFormView from "../views/CourseFormView.vue";
import CourseDetailView from "../views/CourseDetailView.vue";
import LoginView from "../views/LoginView.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "schedule",
      component: ScheduleView,
    },
    {
      path: "/courses/new",
      name: "course-new",
      component: CourseFormView,
    },
    {
      path: "/courses/:id",
      name: "course-detail",
      component: CourseDetailView,
      props: true,
    },
    {
      path: "/courses/:id/edit",
      name: "course-edit",
      component: CourseFormView,
      props: true,
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
  ],
});
