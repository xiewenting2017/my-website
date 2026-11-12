# AI 企业级智能消息中心

> 一个结合 LLM、React 与 Node 的全栈企业消息中心，将多系统消息聚合、AI 智能摘要与审批状态持久化整合进单一入口。

## 项目简介

企业内部的消息散落在审批、考勤、合同、公告等多个系统里，员工需要反复切换平台才能掌握待办与风险。本项目以一个统一的消息中心为载体：前端负责聚合展示与交互，后端以 Express + SQLite 承载消息与偏好数据，并接入 DeepSeek 大模型对未读消息做流式智能摘要，帮助用户在几秒内看清"今天最该处理什么"。

## 核心功能

### 跨系统消息聚合

- 统一收口审批、合同预警、考勤、公告、协同任务等来源的消息，按置顶 / 未读 / 已读三种状态分层展示
- 消息卡片支持置顶、一键已读非待办、快速跳转详情
- 置顶与已读状态即时回写数据库，刷新后保持一致

### AI 智能摘要（基于 DeepSeek 流式输出）

- 基于 DeepSeek API 对未读消息生成一句话摘要，关键事项自动高亮
- 采用 SSE（ReadableStream）逐字下发，具备打字机式呈现效果
- 模型以 `<hl></hl>` 标记重点短语，前端实时解析为黄色下划线高亮；未闭合标签与跨分片标签均有容错处理，保证流式过程中不会误伤普通文本
- 摘要卡片支持「收起 / 展开」折叠，状态与生成流程解耦

### 审批状态持久化（SQLite）

- 使用 SQLite 落库，消息表与偏好设置表均持久化到本地数据库
- 审批通过、驳回、已读、置顶等操作实时写回
- 设置页采用「拨动即保存」：任一开关变更后经 500ms 防抖自动写库，失败自动回滚并提示，无需手动点击保存

### 偏好设置中心

- 通知偏好、免打扰时段与白名单、审批 / 考勤 / 日程 / 协同 / 公告分渠道开关、接收偏好、自定义规则等模块
- 全部配置持久化，刷新后还原

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 19、Tailwind CSS 4、Vite 8、React Router、lucide-react |
| 后端 | Node.js、Express 5、SQLite（`node:sqlite` 内置模块）、SSE 流式响应 |
| 大模型 | DeepSeek API（OpenAI SDK 兼容调用） |
| 测试 | Vitest、@testing-library/react、jsdom |

## 目录结构

```text
oa-ai-app/
├── src/
│   ├── App.jsx            # 消息中心首页、消息详情、AI 摘要页
│   ├── Settings.jsx       # 偏好设置页（即时保存）
│   ├── main.jsx           # 应用入口与路由
│   └── __tests__/         # 单元测试
├── public/icons/          # 消息类型与流程图标
├── db.js                  # SQLite 建表、迁移与数据访问
├── server.js              # Express 服务与 API（消息 / 设置 / AI 摘要）
├── vite.config.js         # Vite 配置与 /api 代理
└── data.db                # SQLite 数据库（首次启动自动生成，不纳入版本控制）
```

## 本地运行指南

### 环境要求

- Node.js ≥ 22.5（`node:sqlite` 内置模块要求；推荐 Node.js 24）
- npm ≥ 10

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# DeepSeek API Key（必填，用于 AI 智能摘要）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# 后端端口（可选，默认 3001）
PORT=3001

# 前端 API 基础地址（可选；本地留空走 Vite 代理，部署时填后端公网地址）
VITE_API_URL=
```

> `.env` 已被 `.gitignore` 忽略，请勿提交真实密钥。

### 3. 启动项目

前后端一键启动（推荐）：

```bash
npm run dev
```

该命令会并行启动两个进程：

- 前端 Vite 开发服务器：http://localhost:5173
- 后端 Express API：http://localhost:3001

也可分别启动：

```bash
npm run dev:web    # 仅前端
npm run dev:api    # 仅后端（带 --watch 热重启）
```

首次启动时，`db.js` 会自动创建 `data.db`、建表并写入种子数据，无需手动初始化数据库。

### 4. 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 前后端并行开发模式 |
| `npm run build` | 构建前端产物 |
| `npm run preview` | 预览构建结果 |
| `npm run lint` | 运行 Oxlint 静态检查 |
| `npm test` | 运行 Vitest 单元测试 |

### 5. 接口一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 服务健康检查 |
| `GET` | `/api/messages` | 获取消息列表（置顶优先） |
| `PATCH` | `/api/messages/:id` | 更新消息已读 / 置顶状态 |
| `GET` | `/api/settings/:role` | 获取指定角色的偏好设置 |
| `POST` / `PUT` | `/api/settings/:role` | 保存偏好设置（前端使用 POST） |
| `POST` | `/api/summary` | AI 摘要生成（SSE 流式返回） |

## 项目截图

<img width="547" height="653" alt="消息中心首页" src="https://github.com/user-attachments/assets/2621dbf2-839c-4161-8043-b8309850f69e" />
<img width="541" height="694" alt="消息详情" src="https://github.com/user-attachments/assets/b15d2c7e-dca8-4cc2-ba51-f161f90cb2a8" />

## 说明

- `data.db` 与 `.env` 不纳入版本控制，仅提交源码与配置模板
- AI 摘要依赖有效的 DeepSeek API Key，未配置时摘要接口将不可用，其余消息与设置功能不受影响
