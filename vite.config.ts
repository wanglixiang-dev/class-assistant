import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [vue()],
    server: {
      proxy: {
        "/api/amap/inputtips": {
          target: "https://restapi.amap.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            const query = path.includes("?") ? path.slice(path.indexOf("?") + 1) : "";
            const params = new URLSearchParams(query);
            if (env.VITE_AMAP_KEY) {
              params.set("key", env.VITE_AMAP_KEY);
            }
            return `/v3/assistant/inputtips?${params.toString()}`;
          },
        },
      },
    },
  };
});
