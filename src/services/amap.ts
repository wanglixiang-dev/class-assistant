import type { Course } from "../domain/course";

export interface AmapOrigin {
  longitude: number;
  latitude: number;
}

export interface AmapPlace {
  name: string;
  address: string;
  longitude: number;
  latitude: number;
}

interface AmapTip {
  name?: string;
  address?: string;
  location?: unknown;
}

interface AmapInputtipsResponse {
  status: string;
  tips?: Array<AmapTip | string>;
  info?: string;
}

export class AmapResolveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmapResolveError";
  }
}

export function hasAmapApiKey(apiKey = import.meta.env.VITE_AMAP_KEY): boolean {
  return Boolean(apiKey?.trim());
}

export async function resolveAmapPlaces(keyword: string, apiKey = import.meta.env.VITE_AMAP_KEY): Promise<AmapPlace[]> {
  if (!keyword.trim() || !apiKey) return [];

  const params = new URLSearchParams({
    keywords: keyword.trim(),
  });

  let response: Response;
  try {
    response = await fetch(`/api/amap/inputtips?${params.toString()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "网络请求失败";
    throw new AmapResolveError(`无法请求高德代理接口：${message}`);
  }

  if (!response.ok) {
    throw new AmapResolveError(`高德代理接口返回 HTTP ${response.status}`);
  }

  const payload = (await response.json()) as AmapInputtipsResponse;
  if (payload.status !== "1") {
    throw new AmapResolveError(`高德 API 返回失败：${payload.info || "未知错误"}`);
  }

  if (!Array.isArray(payload.tips)) return [];

  return payload.tips.flatMap((tip) => {
    if (typeof tip === "string" || !tip.name) return [];
    const coordinate = parseAmapLocation(tip.location);
    if (!coordinate) return [];

    return [
      {
        name: tip.name,
        address: tip.address || "",
        longitude: coordinate.longitude,
        latitude: coordinate.latitude,
      },
    ];
  });
}

function parseAmapLocation(location: unknown): AmapOrigin | null {
  if (typeof location !== "string") return null;

  const [longitudeRaw, latitudeRaw] = location.split(",");
  const longitude = Number(longitudeRaw);
  const latitude = Number(latitudeRaw);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  return { longitude, latitude };
}

export function buildAmapNavigationUrl(course: Course, origin?: AmapOrigin): string {
  const keyword = course.locationName || course.classroom;
  const encodedName = encodeURIComponent(keyword);

  if (course.longitude && course.latitude) {
    if (origin) {
      return `https://uri.amap.com/navigation?from=${origin.longitude},${origin.latitude},当前位置&to=${course.longitude},${course.latitude},${encodedName}&mode=walk&policy=1&src=class-assistant&callnative=0`;
    }

    return `https://uri.amap.com/marker?position=${course.longitude},${course.latitude}&name=${encodedName}&src=class-assistant&callnative=0`;
  }

  return `https://uri.amap.com/search?keyword=${encodedName}&src=class-assistant&callnative=0`;
}

export function hasNavigableLocation(course: Course): boolean {
  return Boolean(course.classroom || course.locationName);
}
