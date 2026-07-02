# 课表助手

课表助手是一个面向学生的个人课表管理前端项目，依据 `docs/PRD.md` 和 `docs/spec.md` 实现。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- localStorage

## 项目结构

```text
class-assistant/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── docs/
│   ├── PRD.md
│   ├── spec.md
│   ├── tasks.md
│   ├── checklist.md
│   └── 需求搜集.md
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── components/
│   ├── domain/
│   ├── router/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   └── views/
└── tests/
    └── course-domain.test.ts
```

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

构建生产包：

```bash
npm run build
```

运行测试：

```bash
npm test
```

## 高德地图配置

V1.1 地点解析可通过环境变量配置高德地图 Web 服务 Key：

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填写：

```text
VITE_AMAP_KEY=你的高德地图Key
```

未配置 Key 时，系统会保留课程教室文本，并使用高德关键词搜索打开地图。

本地开发时，前端请求 `/api/amap/inputtips`，由 Vite 开发服务代理到高德 Web 服务并注入 Key，避免浏览器直接跨域请求 `restapi.amap.com`。

正式部署时，需要提供同等能力的后端代理接口；不要把 Web 服务 Key 直接暴露给浏览器长期使用。

## 当前功能

- 周课表视图
- 上一周 / 下一周切换
- 添加、编辑、删除课程
- 本地保存课程数据
- 课程冲突检测和提示
- 课程详情页
- 空字段状态展示
- V1.1 高德地图导航入口和 URL 适配层
