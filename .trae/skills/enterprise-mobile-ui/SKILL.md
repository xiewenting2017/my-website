---
name: enterprise-mobile-ui
description: >-
  生成企业级移动端管理后台界面，风格简洁商务、卡片化布局、软渐变功能图标、底部四栏导航。
  覆盖工作台、消息、审批发起、表单、人员选择、搜索、排序管理、常用应用自定义等页面。
  Use when building enterprise mobile admin/H5 pages, 消息/日程/工作/我的 tabs,
  workbench, approval forms, person picker, search, reorder lists, app grids,
  or when the user mentions enterprise-mobile-ui、企业移动端、管理后台移动端、人员选择。
---

# 企业级移动端 UI Skill

基于「贵州翔明科技」多页面提炼的设计系统。生成任何企业移动端管理页时，**必须**套用本规范。

**设计语言**：简洁商务 · 卡片化信息 · 克制留白 · 软渐变点缀 · 清晰层级

**氛围**：可靠、清爽、信息优先；`#F7FBFF` 浅底托白卡，主色 `#3A8EF5` 仅作激活/关键操作，彩色渐变图标为唯一强视觉。

**详细参考（按需读取）**：
- 页面类型模板 → [pages.md](pages.md)
- 组件变体规格 → [components.md](components.md)

---

# 核心设计原则

1. **信息卡片化**：白底、圆角 `16px`；一卡一事。
2. **统一 20 间距**：内容区**上下左右边距均为 `20px`**；**模块与模块间距亦为 `20px`**（含卡片栈、分区之间）。用 `--space-page` / `--space-module`。
3. **浅底托白卡**：背景 `#F7FBFF`，卡片 `#FFFFFF`；靠色差分层，不用厚阴影。
4. **主色克制**：`#3A8EF5` 仅用于激活态、链接、关键操作、组织箭头、选中描边；禁止大面积铺主色。
5. **功能色分区**：应用/分类入口用独立软渐变圆角方标 + 白字形；同色相浅→深 `135deg`。
6. **顶栏三栏**：左（组织/返回）· 中（标题 17/600 居中）· 右（工具图标或主色文字按钮如「保存」）。
7. **底栏**：Tab 根页用四栏「消息/日程/工作/我的」；业务子模块可用三栏（如图标+文案）；激活=面性+主色，未激活=线性+次要灰。
8. **8px 网格**：控件内可用 4/8/12；**页面边距与模块间距固定 20**；应用宫格默认 **4 列**。
9. **禁止**：深色主题默认、紫整页主题、多层重阴影、霓虹 glow、装饰性胶囊堆叠；未读可用红点 ≤8px 或数字角标。

---

# 视觉设计规范

## 色彩系统

| Token | 色值 | 用途 |
|-------|------|------|
| `--color-primary` | `#3A8EF5` | 激活、主操作、链接、选中边框 |
| `--color-primary-pressed` | `#2B7DE8` | 主色按压 |
| `--color-primary-soft` | `#E8F3FF` | 浅底按钮、选中卡底、区头浅底 |
| `--color-bg-page` | `#F7FBFF` | 页面背景 |
| `--color-bg-elevated` | `#FFFFFF` | 顶栏、底栏、卡片 |
| `--color-border-subtle` | `#EBEDF0` | 分割线、淡描边 |
| `--color-text-primary` | `#333333` | 标题、主文案 |
| `--color-text-secondary` | `#8` | 摘要、未激活、提示 |
| `--color-text-placeholder` | `#C8C9CC` | 占位 |
| `--color-danger` | `#FF5733` | 必填 *、未读、错误 |
| `--color-success` | `#52C41A` | 流程发起人/成功 |
| `--color-cyan` | `#13C2C2` | 流程节点变体 |
| `--color-warning` | `#FA8C16` | 抄送/提醒 |
| `--color-tag-blue-bg` | `#E6F4FF` | 审批人标签底 |
| `--color-tag-blue-text` | `#3A8EF5` | 审批人标签字 |
| `--color-tag-purple-bg` | `#F3E8FF` | 特殊角色标签底 |
| `--color-tag-purple-text` | `#8B5CF6` | 特殊角色标签字 |

### 应用入口渐变（4 列宫格，容器约 52×52，r16）

| 语义示例 | Gradient `135deg` |
|----------|-------------------|
| 文件/橙 | `#FFB84D` → `#FF8C00` |
| 审批/绿 | `#6DE698` → `#1BC09B` |
| 考勤·付款/蓝 | `#64B5F6` → `#3A8EF5` |
| 协作/红粉 | `#FF9E8A` → `#FF5E5E` |
| 日志/紫 | `#C2A5FF` → `#8E6BFF` |
| 任务·费用/黄 | `#FFE066` → `#FFCC00` |
| 公告/紫蓝 | `#B8B5FF` → `#7B76F0` |
| 通知/橙黄 | `#FFD54F` → `#FF9800` |

### CSS 变量（必写）

```css
:root {
  --color-primary: #3A8EF5;
  --color-primary-pressed: #2B7DE8;
  --color-primary-soft: #E8F3FF;
  --color-bg-page: #F7FBFF;
  --color-bg-elevated: #FFFFFF;
  --color-border-subtle: #EBEDF0;
  --color-text-primary: #323233;
  --color-text-secondary: #969799;
  --color-text-placeholder: #C8C9CC;
  --color-danger: #EE0A24;
  --radius-card: 16px;
  --radius-icon: 16px;
  --radius-control: 8px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-page: 20px;   /* 内容区上下左右边距 */
  --space-module: 20px; /* 模块与模块间距 */
  --space-xl: 24px;
  --nav-height: 44px;
  --tabbar-height: 50px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

## 字体系统

字体栈：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif`

| 层级 | 字号/字重/行高 | 颜色 | 场景 |
|------|----------------|------|------|
| Nav Title | 17/600/24 | `#333333` | 顶栏标题 |
| Nav Action | 16/400/22 | `#3A8EF5` | 顶栏右「保存」 |
| Section | 16–18/600/24 | `#323233` | 区块标题 |
| Card Title | 16/500/22 | `#323233` | 卡片/列表主标题 |
| Body | 14–15/400/20 | `#323233` / `#666` | 正文、表单标签 |
| Meta | 12–13/400/18 | `#969799` | 摘要、时间、提示 |
| Tab Label | 10/400/14 | 激活主色 / 未激活次要灰 | 底栏 |
| App Label | 12/400/16 | `#323233` | 宫格图标下文案 |
| Metric | 22–28/600 | `#3A8EF5` | 合同/巡检大数字 |

单行省略：`overflow:hidden; white-space:nowrap; text-overflow:ellipsis`

## 间距 · 圆角 · 阴影

| 属性 | 值 |
|------|-----|
| 内容区上/下/左/右边距 | **`20px`**（`--space-page`） |
| 模块与模块间距 | **`20px`**（`--space-module`） |
| 卡片间距（同模块间距） | **`20px`** |
| 卡片内边距 | `16px`（卡内；卡外仍用 20） |
| 区块标题与内容 | `12–16px` |
| 宫格列间距 | 均分，约 `12–16px` |
| 卡片圆角 | `16px` |
| 应用图标容器圆角 | `16px` |
| 搜索框/小标签卡 | `8–12px` |
| 主按钮圆角 | `8px` |
| 卡片阴影 | `0 1px 4px rgba(0,0,0,0.04)`（可省略） |

**落地**：`.content { padding: var(--space-page); }`；相邻模块 `margin-bottom: var(--space-module)` 或父级 `gap: var(--space-module)`。底栏上方最后一模块仍保留 20，再叠加底栏安全区。

## 图标与底栏

- **应用图标**：52×52（消息分类卡可用 48×48），白字形约 24×24，软渐变底。
- **区块标题旁小图标**：约 18–20px，主色或语义色。
- **底栏四栏**：消息 / 日程 / 工作 / 我的；高 50px+safe；激活面性+`#3A8EF5`，未激活线性+`#969799`。
- **业务三栏示例**：发起审批 / 审批中心 / 统计分析（同规则）。

---

# 页面类型速查

生成前先匹配类型，细节读 [pages.md](pages.md)：

| 类型 | 骨架要点 |
|------|----------|
| A 消息 Tab | 顶栏组织切换 + 分类入口竖卡列表 + 四栏底 |
| B 工作台 Tab | Banner + 常用应用 4 列宫格 + 分类 Tab 宫格 + 业务模块白卡栈 + 四栏底 |
| C 审批发起 | 返回顶栏 + 顶部快捷状态 4 宫格 + 可折叠分组 4 列入口 + 业务三栏底 |
| D 表单申请 | 返回顶栏 + 白底表单字段栈 + 审批流程时间线（可无主底栏） |
| E 搜索 | 返回顶栏 + 搜索框 + 最近搜索 Chip + 结果行卡 |
| F 排序管理 | 返回+「保存」+ 可拖拽排序卡列表（含选中态） |
| G 常用应用自定义 | 返回+「保存」+ 已选/未添加分区 + 4 列宫格 ± 角标 |
| H 人员选择 | 取消 + 居中搜人名 + 字母分组列表 + 右侧索引 |

---

# 组件变体速查

细节读 [components.md](components.md)：

| 变体 | 一句话 |
|------|--------|
| CategoryRowCard | 左 48 渐变标 + 标题 + 摘要 |
| AppGridItem | 4 列；52 渐变标 + 12px 标签；可选 ± 角标 |
| HeroBanner | 白卡内浅蓝渐变 + 文案 + 插画 + 圆点指示 |
| SectionHeader | 标题 + 可选右侧设置/更多/折叠箭头 |
| SegmentTabs | 横滑文字 Tab，激活主色加粗 |
| SoftPrimaryButton | 高约 40–44，底 `#E8F3FF`，字 `#3A8EF5` |
| StatusPill | 浅底+同色相文字小胶囊（正常/未打卡等） |
| MetricSplitCard | 大数字+说明；可左右分栏或主+辅栈 |
| TodoRow | 左小图标 + 标题 + 灰色副文案 |
| FileGrid | 3 列文件类型图标 |
| QuickActionGlass | 顶部 4 快捷：半透明蓝底圆标 + 红数字角标 |
| CollapseGroup | 分组标题 + 展开箭头 + 下挂 4 列宫格 |
| FormField | 上标签（可 *）下值/占位 + 底部分割线 |
| ApprovalTimeline | 竖线节点 + 角色色圆标 + 人名 Chip + `>` `/` `+` 逻辑符 |
| SearchBar | 白底 r8–12，左放大镜 + 占位 |
| RecentChip | 白底小圆角标签卡 |
| ListNavRow | 左图标 + 标题 + 右 chevron |
| ReorderCard | 白卡；选中：底 `#EBF4FF` + 边 `#3A8EF5` + 字主色 + 右侧拖拽柄 |
| PersonPicker | 取消+居中搜人名；字母区头；彩字头像行；选中浅蓝通栏；右侧 A–Z 索引 |

---

# 工作流程

1. **定页面类型**（A–G）→ 打开 [pages.md](pages.md) 对应模板。
2. **声明 CSS 变量** → 禁止临时发明色值。
3. **搭骨架**：状态栏 → 顶栏 → `#F7FBFF` 内容 → 底栏（若需要）。
4. **组装变体** → 按需读 [components.md](components.md)。
5. **状态完备**：默认/激活/选中/占位/空态/角标。
6. **自检**：主色未铺底；**页边距与模块间距均为 20**；卡片圆角 16；宫格 4 列；底栏线/面正确；安全区。

---

# 代码规范

1. 移动优先 375 逻辑宽；`box-sizing: border-box`；禁横向滚动。
2. 结构：`page` > `nav-bar` + `content` + 可选 `tab-bar`。
3. 颜色/圆角/间距只用 CSS 变量；BEM 或等价命名。
4. 底栏 `position: fixed`；`content` 预留 `padding-bottom: calc(50px + env(safe-area-inset-bottom))`。
5. 图标优先 SVG；渐变用 CSS，勿位图圆角失真。
6. 热区 ≥ 44×44；Tab `aria-current="page"`。
7. 禁止 Inter/Roboto 品牌展示、Tailwind 默认紫主题、过重 `backdrop-filter`/glow。
8. 多页共享同一变量文件，不复制魔法数字。

按本 Skill 生成的页面应一眼可识别：浅蓝白底、白卡片 r16、蓝激活、软渐变入口、清晰模块栈。
