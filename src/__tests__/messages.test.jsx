import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatMessageTime, fromDbMessage } from '../App.jsx'

describe('fromDbMessage', () => {
  const baseRow = {
    id: 999,
    source_system: 'OA',
    title: '测试标题',
    content: '测试内容',
    created_at: '2024-07-18 09:31',
    type: 'todo',
    is_read: 1,
    is_pinned: 0,
  }

  it('is_read / is_pinned 数字映射为布尔 read / pinned', () => {
    const msg = fromDbMessage(baseRow)
    expect(msg.read).toBe(true)
    expect(msg.pinned).toBe(false)

    const msg2 = fromDbMessage({ ...baseRow, is_read: 0, is_pinned: 1 })
    expect(msg2.read).toBe(false)
    expect(msg2.pinned).toBe(true)
  })

  it('id 命中本地 mock 时保留本地 iconPath 等富字段', () => {
    // 本地 INITIAL_MESSAGES 中 id=5 的 iconPath 为 /icons/finance.png
    const msg = fromDbMessage({ ...baseRow, id: 5, type: 'todo' })
    expect(msg.iconPath).toBe('/icons/finance.png')
    // DB 的 read/pinned 仍覆盖本地
    expect(msg.read).toBe(true)
    expect(msg.pinned).toBe(false)
  })

  it('id 未命中本地时按类型使用 TYPE_ICON 兜底', () => {
    expect(fromDbMessage({ ...baseRow, type: 'todo' }).iconPath).toBe('/icons/approval.png')
    expect(fromDbMessage({ ...baseRow, type: 'notice' }).iconPath).toBe('/icons/admin.png')
    expect(fromDbMessage({ ...baseRow, type: 'alert' }).iconPath).toBe('/icons/alert.png')
  })
})

describe('formatMessageTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 固定当前时间为 2024-07-18 12:00:00（本地时区构造，避免时区偏差）
    vi.setSystemTime(new Date(2024, 6, 18, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('今天的消息显示 HH:mm', () => {
    expect(formatMessageTime('2024-07-18 09:31')).toBe('09:31')
  })

  it('昨天的消息显示「昨天」', () => {
    expect(formatMessageTime('2024-07-17 18:00')).toBe('昨天')
  })

  it('更早的消息显示 MM-DD', () => {
    expect(formatMessageTime('2024-10-05 10:00')).toBe('10-05')
  })

  it('无法解析的输入原样返回', () => {
    expect(formatMessageTime('垃圾')).toBe('垃圾')
  })
})
