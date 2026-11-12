// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Settings from '../Settings.jsx'

const SETTINGS_URL = `/api/settings/${encodeURIComponent('财务')}`

const settingsPayload = {
  settings: {
    app_push_enabled: 1,
    dnd_enabled: 1,
    dnd_start: '22:00',
    dnd_end: '08:00',
    prefs: { sound: { sound: false, vibrate: true }, ruleCards: [] },
  },
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn(async (url, options = {}) => {
    const u = String(url)
    if (u === SETTINGS_URL) {
      if (options.method === 'POST' || options.method === 'PUT') {
        return { ok: true, json: async () => ({ ok: true }) }
      }
      return { ok: true, json: async () => settingsPayload }
    }
    return { ok: true, json: async () => ({}) }
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** 「声音」行内的 Switch 开关（button[role=switch]） */
async function findSoundSwitch() {
  const label = await screen.findByText('声音')
  let row = label
  while (row && !row.querySelector('button[role="switch"]')) {
    row = row.parentElement
  }
  if (!row) throw new Error('未找到「声音」行容器')
  return row.querySelector('button[role="switch"]')
}

describe('Settings 设置页', () => {
  it('远端 prefs.sound.sound=false 应用后「声音」开关为关闭态', async () => {
    render(<Settings onBack={() => {}} />)

    const toggle = await findSoundSwitch()
    // 远端配置异步加载完成后才生效
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))
    // 关闭态使用灰色背景
    expect(toggle.className).toContain('bg-gray-200')
  })

  it('改动「声音」后点保存，POST 提交完整快照', async () => {
    const user = userEvent.setup()
    render(<Settings onBack={() => {}} />)

    const toggle = await findSoundSwitch()
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))

    // 用户改动：打开声音开关
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    const saveBtn = screen.getByRole('button', { name: '保存设置' })
    await waitFor(() => expect(saveBtn).toBeEnabled())
    await user.click(saveBtn)

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([u, o]) => String(u) === SETTINGS_URL && o?.method === 'POST'
      )
      expect(postCall).toBeTruthy()
      const body = JSON.parse(postCall[1].body)
      expect(body.prefs.sound.sound).toBe(true)
      expect(body.app_push_enabled).toBe(true)
    })
  })

  it('拨动「声音」开关后 500ms 防抖自动 POST 保存（无需点击保存按钮）', async () => {
    const user = userEvent.setup()
    render(<Settings onBack={() => {}} />)

    const toggle = await findSoundSwitch()
    // 等待远端配置应用完成
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))

    // 用户拨动开关，不点击保存按钮
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    // 等待防抖触发自动保存（真实定时器轮询，超时 2000ms）
    await waitFor(
      () => {
        const postCall = fetchMock.mock.calls.find(
          ([u, o]) => String(u) === SETTINGS_URL && o?.method === 'POST'
        )
        expect(postCall).toBeTruthy()
        const body = JSON.parse(postCall[1].body)
        expect(body.prefs.sound.sound).toBe(true)
      },
      { timeout: 2000 }
    )
  })
})
