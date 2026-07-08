export type WeekType = "all" | "odd" | "even";

export interface Course {
  id: string;
  name: string;
  teacher: string;
  classroom: string;
  weekday: number;
  startPeriod: number;
  endPeriod: number;
  startWeek: number;
  endWeek: number;
  weekType: WeekType;
  color: string;
  homework: string;
  examDate: string;
  note: string;
  locationName: string;
  locationAddress: string;
  longitude: number | null;
  latitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export type CourseInput = Omit<Course, "id" | "weekType" | "color" | "createdAt" | "updatedAt"> & {
  id?: string;
  weekType?: WeekType;
  color?: string;
  createdAt?: string;
};

export interface CourseValidationResult {
  valid: boolean;
  errors: Partial<Record<"name" | "weekday" | "period" | "week" | "examDate", string>>;
}

export const courseColors = [
  "#c7e9df",
  "#f9d6a3",
  "#c9ddff",
  "#f5c3ce",
  "#d7d1f6",
  "#cbe7a5",
  "#ffd6c2",
  "#c7e1e8",
];

export function normalizeWeekType(value: unknown): WeekType {
  return value === "odd" || value === "even" ? value : "all";
}

export function generateCourseId(): string {
  return `course_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function assignCourseColor(existingCourses: Course[], courseId?: string): string {
  const existing = existingCourses.find((course) => course.id === courseId);
  if (existing) return existing.color;
  return courseColors[existingCourses.length % courseColors.length];
}

export function validateCourse(course: Pick<Course, "name" | "weekday" | "startPeriod" | "endPeriod" | "startWeek" | "endWeek" | "examDate">): CourseValidationResult {
  const errors: CourseValidationResult["errors"] = {};

  if (!course.name.trim()) {
    errors.name = "请输入课程名";
  }

  if (!course.weekday || course.weekday < 1 || course.weekday > 7) {
    errors.weekday = "请选择星期";
  }

  if (!course.startPeriod || !course.endPeriod) {
    errors.period = "请选择节次";
  } else if (
    course.startPeriod < 1 ||
    course.endPeriod > 12 ||
    course.startPeriod > course.endPeriod
  ) {
    errors.period = "请输入有效节次";
  }

  if (!course.startWeek || !course.endWeek) {
    errors.week = "请输入有效周次";
  } else if (course.startWeek < 1 || course.startWeek > course.endWeek) {
    errors.week = "请输入有效周次";
  }

  if (course.examDate && !/^\d{4}-\d{2}-\d{2}$/.test(course.examDate)) {
    errors.examDate = "请输入有效考试日期";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function inferLocationFromClassroom(classroom: string): Pick<Course, "locationName" | "locationAddress" | "longitude" | "latitude"> {
  if (!classroom.trim()) {
    return {
      locationName: "",
      locationAddress: "",
      longitude: null,
      latitude: null,
    };
  }

  const canSearch = /楼|馆|操场|场|校区|教学|实验/.test(classroom);
  if (!canSearch) {
    return {
      locationName: "",
      locationAddress: "",
      longitude: null,
      latitude: null,
    };
  }

  return {
    locationName: classroom.replace(/[0-9A-Za-z-]+$/g, "").trim() || classroom,
    locationAddress: "演示搜索词，接入高德地图 API 后返回精确地址",
    longitude: null,
    latitude: null,
  };
}

export function createCourse(input: CourseInput, existingCourses: Course[]): Course {
  const now = new Date().toISOString();
  const id = input.id || generateCourseId();
  return {
    id,
    name: input.name.trim(),
    teacher: input.teacher.trim(),
    classroom: input.classroom.trim(),
    weekday: Number(input.weekday),
    startPeriod: Number(input.startPeriod),
    endPeriod: Number(input.endPeriod),
    startWeek: Number(input.startWeek),
    endWeek: Number(input.endWeek),
    weekType: normalizeWeekType(input.weekType),
    color: input.color || assignCourseColor(existingCourses, id),
    homework: input.homework.trim(),
    examDate: input.examDate,
    note: input.note.trim(),
    locationName: input.locationName,
    locationAddress: input.locationAddress,
    longitude: input.longitude,
    latitude: input.latitude,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

export function createDemoCourses(): Course[] {
  const now = new Date().toISOString();
  return [
    {
      id: "course_math",
      name: "高等数学",
      teacher: "王老师",
      classroom: "教学楼 A101",
      weekday: 1,
      startPeriod: 1,
      endPeriod: 2,
      startWeek: 1,
      endWeek: 16,
      weekType: "all",
      color: courseColors[0],
      homework: "完成第 3 章课后习题，周五前提交。",
      examDate: "2026-11-20",
      note: "需要带教材和练习册。",
      locationName: "第一教学楼",
      locationAddress: "校园东区",
      longitude: null,
      latitude: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "course_english",
      name: "大学英语",
      teacher: "李老师",
      classroom: "B203",
      weekday: 3,
      startPeriod: 1,
      endPeriod: 2,
      startWeek: 1,
      endWeek: 12,
      weekType: "all",
      color: courseColors[2],
      homework: "准备 3 分钟课堂展示。",
      examDate: "",
      note: "",
      locationName: "",
      locationAddress: "",
      longitude: null,
      latitude: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "course_cs",
      name: "程序设计基础",
      teacher: "陈老师",
      classroom: "实验楼 D405",
      weekday: 2,
      startPeriod: 3,
      endPeriod: 4,
      startWeek: 1,
      endWeek: 16,
      weekType: "all",
      color: courseColors[3],
      homework: "完成数组练习题。",
      examDate: "",
      note: "上机课。",
      locationName: "实验楼",
      locationAddress: "校园北区",
      longitude: null,
      latitude: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "course_pe",
      name: "体育",
      teacher: "赵老师",
      classroom: "操场",
      weekday: 4,
      startPeriod: 3,
      endPeriod: 4,
      startWeek: 3,
      endWeek: 16,
      weekType: "all",
      color: courseColors[5],
      homework: "",
      examDate: "",
      note: "雨天改到体育馆。",
      locationName: "田径场",
      locationAddress: "校园西区",
      longitude: null,
      latitude: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "course_physics",
      name: "大学物理",
      teacher: "孙老师",
      classroom: "C301",
      weekday: 5,
      startPeriod: 1,
      endPeriod: 2,
      startWeek: 2,
      endWeek: 10,
      weekType: "all",
      color: courseColors[4],
      homework: "",
      examDate: "2026-12-05",
      note: "",
      locationName: "",
      locationAddress: "",
      longitude: null,
      latitude: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
