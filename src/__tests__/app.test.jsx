// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'

const PINNED_TODO_TITLE = '公务业务采购申请审批单'
const NOTICE_TITLE = '办公区空调安全检查公告'

const messagesPayload = {
  messages: [
    {
      id: 1,
      source_system: 'OA',
      title: PINNED_TODO_TITLE,
      content: '王晨提交了办公设备采购申请。',
      created_at: '2024-07-18 09:31',
      type: 'todo',
      is_read: 0,
      is_pinned: 1,
    },
    {
      id: 2,
      source_system: 'OA',
      title: NOTICE_TITLE,
      content: '请各部门配合注意安全事项。',
      created_at: '2024-07-18 08:45',
      type: 'notice',
      is_read: 0,
      is_pinned: 0,
    },
  ],
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn(async (url, options = {}) => {
    const u = String(url)
    if (u === '/api/messages' && (!options.method || options.method === 'GET')) {
      return { ok: true, json: async () => messagesPayload }
    }
    // PATCH 等其余请求统一兜底
    return { ok: true, json: async () => ({}) }
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  )
}

describe('App 消息列表', () => {
  it('加载后端消息后渲染卡片，置顶消息排在前面', async () => {
    renderApp()

    await screen.findByText(PINNED_TODO_TITLE)
    await screen.findByText(NOTICE_TITLE)

    const articles = [...document.querySelectorAll('article')]
    const texts = articles.map((a) => a.textContent)
    const pinnedIdx = texts.findIndex((t) => t.includes(PINNED_TODO_TITLE))
    const noticeIdx = texts.findIndex((t) => t.includes(NOTICE_TITLE))

    expect(pinnedIdx).toBeGreaterThanOrEqual(0)
    expect(noticeIdx).toBeGreaterThanOrEqual(0)
    // id=1（is_pinned=1）必须排在 id=2（is_pinned=0）之前
    expect(pinnedIdx).toBeLessThan(noticeIdx)
  })

  it('点击「置顶」按钮乐观更新并 PATCH 回写 is_pinned', async () => {
    const user = userEvent.setup()
    renderApp()

    await screen.findByText(NOTICE_TITLE)

    const card = screen.getByText(NOTICE_TITLE).closest('article')
    const pinBtn = within(card).getByRole('button', { name: '置顶' })
    await user.click(pinBtn)

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        ([u, o]) => u === '/api/messages/2' && o?.method === 'PATCH'
      )
      expect(patchCall).toBeTruthy()
      expect(JSON.parse(patchCall[1].body)).toMatchObject({ is_pinned: true })
    })
  })
})
