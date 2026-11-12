// SQLite 数据层：node:sqlite 为 Node 24 内置模块，无需额外依赖
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new DatabaseSync(path.join(__dirname, 'data.db'))

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_system TEXT NOT NULL,                                  -- 来源系统
  title TEXT NOT NULL,                                          -- 标题
  content TEXT NOT NULL,                                        -- 内容
  created_at TEXT NOT NULL,                                     -- 时间
  type TEXT NOT NULL CHECK (type IN ('todo','notice','alert')), -- 类型：待办/公告/预警
  is_read INTEGER NOT NULL DEFAULT 0,                           -- 是否已读
  is_pinned INTEGER NOT NULL DEFAULT 0                          -- 是否置顶
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_role TEXT NOT NULL UNIQUE,                    -- 用户角色（如：财务）
  app_push_enabled INTEGER NOT NULL DEFAULT 1,       -- 是否开启 APP 推送
  dnd_enabled INTEGER NOT NULL DEFAULT 0,            -- 免打扰开关
  dnd_start TEXT NOT NULL DEFAULT '22:00',           -- 免打扰开始时间
  dnd_end TEXT NOT NULL DEFAULT '08:00',             -- 免打扰结束时间
  updated_at TEXT
);
`)

// 轻量迁移：老库补 prefs 列（其余偏好设置的 JSON 快照）
const settingsCols = db.prepare('PRAGMA table_info(settings)').all().map((c) => c.name)
if (!settingsCols.includes('prefs')) {
  db.exec('ALTER TABLE settings ADD COLUMN prefs TEXT')
}

// ---- 种子数据（仅首次为空时写入）----
const messageCount = db.prepare('SELECT COUNT(*) AS c FROM messages').get().c
if (messageCount === 0) {
  const seed = db.prepare(
    'INSERT INTO messages (source_system, title, content, created_at, type, is_read, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const rows = [
    ['用友', '公务业务采购申请审批', '王晨提交了办公设备采购申请，金额¥12,680，请您及时处理。', '2024-07-18 09:31', 'todo', 0, 1],
    ['OA', '关于办公区空调安全检查的通知', '请各部门在周五前提交本月工作总结，以便汇总季度报告。', '2024-07-18 08:45', 'notice', 0, 0],
    ['OA', '员工合同即将到期提醒', '有2名员工的劳动合同将在30天内到期，请及时跟进续签。', '2024-07-17 18:00', 'alert', 0, 0],
    ['OA', '新员工入职培训安排', '下周三下午2点将举行新员工入职培训，请相关负责人准时参加。', '2024-10-05 10:00', 'notice', 1, 0],
    ['用友', '9月工资已发放', '9月工资条已发放，请登录薪酬模块查看并确认。', '2024-10-05 09:00', 'todo', 1, 0],
    ['钉钉', '差旅费用报销审批', '李娜提交了上海客户拜访的差旅费用报销，金额¥3,200，等待审批。', '2024-11-08 11:08', 'todo', 0, 0],
  ]
  for (const r of rows) seed.run(...r)
}

const settingsCount = db.prepare('SELECT COUNT(*) AS c FROM settings').get().c
if (settingsCount === 0) {
  db.prepare(
    "INSERT INTO settings (user_role, app_push_enabled, dnd_enabled, dnd_start, dnd_end, updated_at) VALUES ('财务', 1, 1, '22:00', '08:00', ?)"
  ).run(new Date().toISOString())
}

// ---- messages ----
export function listMessages() {
  return db
    .prepare('SELECT * FROM messages ORDER BY is_pinned DESC, id ASC')
    .all()
}

export function updateMessageFlags(id, { is_read, is_pinned }) {
  const sets = []
  const values = []
  if (is_read !== undefined) {
    sets.push('is_read = ?')
    values.push(is_read ? 1 : 0)
  }
  if (is_pinned !== undefined) {
    sets.push('is_pinned = ?')
    values.push(is_pinned ? 1 : 0)
  }
  if (sets.length === 0) return db.prepare('SELECT * FROM messages WHERE id = ?').get(id)
  values.push(id)
  db.prepare(`UPDATE messages SET ${sets.join(', ')} WHERE id = ?`).run(...values)
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id)
}

// ---- settings ----
export function getSettings(role) {
  return db.prepare('SELECT * FROM settings WHERE user_role = ?').get(role)
}

export function upsertSettings(role, s) {
  db.prepare(
    `INSERT INTO settings (user_role, app_push_enabled, dnd_enabled, dnd_start, dnd_end, prefs, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_role) DO UPDATE SET
       app_push_enabled = excluded.app_push_enabled,
       dnd_enabled = excluded.dnd_enabled,
       dnd_start = excluded.dnd_start,
       dnd_end = excluded.dnd_end,
       prefs = excluded.prefs,
       updated_at = excluded.updated_at`
  ).run(
    role,
    s.app_push_enabled ? 1 : 0,
    s.dnd_enabled ? 1 : 0,
    s.dnd_start ?? '22:00',
    s.dnd_end ?? '08:00',
    s.prefs ? JSON.stringify(s.prefs) : null,
    new Date().toISOString()
  )
  return getSettings(role)
}

export default db
