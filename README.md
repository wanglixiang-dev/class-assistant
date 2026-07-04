# 课表助手

课表助手是一个面向学生的个人课表管理前端项目，依据 `docs/PRD.md` 和 `docs/spec.md` 实现。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- localStorage fallback
- Node.js API
- SQLite

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
├── server/
│   ├── auth.mjs
│   ├── courses.mjs
│   ├── database.mjs
│   ├── email.mjs
│   ├── index.mjs
│   └── reminders.mjs
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

启动 API 服务：

```bash
npm run api
```

同时启动前端和 API：

```bash
npm run dev:full
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

## 邮箱登录、数据库和考试提醒

新增 API 服务提供邮箱验证码登录、用户课程数据库保存和考试日期邮件提醒。

默认配置：

- API 地址：`http://127.0.0.1:4174`
- 数据库：`data/class-assistant.sqlite`
- 登录验证码有效期：10 分钟
- 考试提醒：提前 7 天、3 天、1 天扫描提醒
- 未配置邮件服务时，邮件会输出到 API 控制台，便于本地开发调试

可选环境变量：

```text
API_PORT=4174
DATABASE_PATH=data/class-assistant.sqlite
APP_URL=http://127.0.0.1:5173
LOGIN_CODE_MINUTES=10
SESSION_DAYS=30
REMINDER_DAYS_BEFORE=7,3,1
REMINDER_SCAN_MINUTES=60
MAIL_FROM=课表助手 <no-reply@mail.wanglx.top>
DIRECTMAIL_SMTP_HOST=smtpdm.aliyun.com
DIRECTMAIL_SMTP_PORT=465
DIRECTMAIL_SMTP_SECURE=true
DIRECTMAIL_SMTP_USER=你的阿里云 DirectMail SMTP 用户名
DIRECTMAIL_SMTP_PASSWORD=你的阿里云 DirectMail SMTP 密码
```

配置 `DIRECTMAIL_SMTP_USER` 和 `DIRECTMAIL_SMTP_PASSWORD` 后，系统会通过阿里云 DirectMail 发送登录验证码和考试提醒邮件；未配置时使用控制台邮件适配器。

阿里云 DirectMail 发信域名为 `mail.wanglx.top` 时，建议将 `MAIL_FROM` 配成已在 DirectMail 控制台验证通过的发信地址，例如：

```text
MAIL_FROM=课表助手 <no-reply@mail.wanglx.top>
```

## 当前功能

- 周课表视图
- 上一周 / 下一周切换
- 添加、编辑、删除课程
- 本地保存课程数据
- 邮箱验证码登录
- 登录后保存课程到 SQLite 数据库
- 临近考试日期自动邮件提醒
- 课程冲突检测和提示
- 课程详情页
- 空字段状态展示
- V1.1 高德地图导航入口和 URL 适配层
