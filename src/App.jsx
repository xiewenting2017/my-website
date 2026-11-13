import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { apiUrl } from './api'
import Login, { getAuth, clearAuth } from './Login'
import Workbench from './Workbench'
import Approvals from './Approvals'
import Settings from './Settings'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待办' },
  { key: 'alert', label: '预警' },
  { key: 'notice', label: '公告' },
]

/** 来源系统筛选（统一消息池多系统聚合） */
const SOURCES = ['全部来源', 'OA', '用友', '钉钉']

/** 来源标签配色 */
const SOURCE_TAG_STYLE = {
  OA: 'bg-[#F3F4F6] text-[#666666]',
  用友: 'bg-[#FFF7ED] text-[#EA580C]',
  钉钉: 'bg-[#EFF6FF] text-[#3A8EF5]',
}

// 解析摘要文本中的 <hl> 标签渲染为高亮样式；流式传输中容忍未闭合/半截标签
export function renderHighlightText(text) {
  // 末尾的半截标签（如 `<`、`</h`）先不渲染，等后续分片补齐
  const safeText = text.replace(/<\/?h?l?$/, '')
  const parts = []
  // 只把成对闭合的 <hl>...</hl> 渲染为高亮，避免未闭合标签误伤后续文本
  const regex = /<hl>([\s\S]*?)<\/hl>/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(safeText)) !== null) {
    if (match.index > lastIndex) parts.push(safeText.slice(lastIndex, match.index))
    parts.push(
      <span
        key={parts.length}
        className="text-[#FDF5B2] underline decoration-[#FDF5B2] decoration-1 underline-offset-4"
      >
        {match[1]}
      </span>
    )
    lastIndex = regex.lastIndex
  }
  // 剩余文本：去掉未闭合的 <hl> 起始标签，按普通文本渲染（</hl> 到达后自动转为高亮）
  const rest = safeText.slice(lastIndex).replace(/<hl>/, '')
  if (rest) parts.push(rest)
  return parts
}

const INITIAL_MESSAGES = [
  {
    id: 1,
    type: 'todo',
    sourceSystem: 'OA',
    approvalMode: 'local', // local = 本地待办，可直接回写；third = 第三方待办，需回原系统处理
    read: false,
    iconPath: '/icons/approval.png',
    sender: '采购审批',
    senderFull: '采购审批',
    time: '09:31',
    title: '公务业务采购申请审批',
    content: '王晨提交了办公设备采购申请，金额¥12,680，请您及时处理。',
    // 审批详情
    amount: '¥12,680.00',
    applicant: '王晨 · 采购部',
    dept: '行政部',
    deadline: '截至今日 18:00',
    reason: '办公空调维护所需配件采购',
    approvalNo: 'PO-2024-0718',
    // ===== 测试场景字段（二选一，置 true 预览对应状态）=====
    approvalInProgress: true,  // true = 正在审批流程中
    approvalCompleted: false,  // true = 审批已完成
    flow: [
      { node: '提交 · 王小明', time: '2024-07-18 10:30', status: 'done' },
      { node: '部门审批 · 已完成', time: '2024-07-18 12:00', status: 'done' },
      { node: '财务复核 · 已复核', time: '2024-07-18 16:26', status: 'done' },
      { node: '流程完成', time: '处理人：系统', status: 'completed' },
    ],
    pinned: true,
    actions: ['togglePin', 'detail', 'approve'],
  },
  {
    id: 2,
    type: 'notice',
    sourceSystem: 'OA',
    read: false,
    iconPath: '/icons/admin.png',
    sender: '行政部',
    senderFull: '行政部',
    time: '08:45',
    title: '关于办公区空调安全检查的通知',
    content: '请各部门在周五前提交本月工作总结，以便汇总季度报告。',
    publisher: '行政部 · 张敏',
    readCount: 68,
    publishedAt: '2024-07-18',
    noticeFull: `各位同事：

因近期持续高温，为保障办公区空调设备的安全稳定运行，请各部门同事配合注意以下事项：

1. 空调开启时请关好门窗，避免长时间敞门导致设备超负荷运行；

2. 下班离开前请确认关闭空调，避免设备低温长时间运转；

3. 如发现空调出风异常、异响或温度持续偏高，请及时联系行政部处理。

感谢大家的理解与配合！

行政部 2024-07-18`,
    pinned: false,
    actions: ['togglePin'],
  },
  {
    id: 3,
    type: 'alert',
    sourceSystem: 'OA',
    read: false,
    iconPath: '/icons/alert.png',
    sender: '系统预警',
    senderFull: '系统预警',
    time: '昨天',
    title: '员工合同即将到期提醒',
    content: '有2名员工的劳动合同将在30天内到期，请及时跟进续签。',
    pinned: false,
    actions: ['togglePin'],
  },
  {
    id: 4,
    type: 'notice',
    sourceSystem: 'OA',
    read: true,
    iconPath: '/icons/hr.png',
    sender: '人力资源部',
    senderFull: '人力资源部',
    time: '10-05',
    title: '新员工入职培训安排',
    content: '下周三下午2点将举行新员工入职培训，请相关负责人准时参加。',
    publisher: '人力资源部',
    readCount: 12,
    publishedAt: '2024-10-05',
    noticeFull: '详情内容…',
    pinned: false,
    actions: ['togglePin'],
  },
  {
    id: 5,
    type: 'todo',
    sourceSystem: '用友',
    read: true,
    iconPath: '/icons/finance.png',
    sender: '财务部',
    senderFull: '财务部',
    time: '10-05',
    title: '9月工资已发放',
    content: '9月工资条已发放，请登录薪酬模块查看并确认。',
    amount: '请登录薪酬查看',
    applicant: '全体员工',
    dept: '财务部',
    pinned: false,
    actions: ['togglePin'],
  },
  {
    id: 6,
    type: 'todo',
    sourceSystem: '钉钉',
    approvalMode: 'third', // 第三方系统待办：本地只做提醒，需回原系统处理
    read: false,
    iconPath: '/icons/approval.png',
    sender: '费用报销',
    senderFull: '费用报销',
    time: '11:08',
    title: '差旅费用报销审批',
    content: '李娜提交了上海客户拜访的差旅费用报销，金额¥3,200，等待审批。',
    amount: '¥3,200.00',
    applicant: '李娜 · 市场部',
    dept: '市场部',
    deadline: '截至明日 12:00',
    reason: '上海客户拜访差旅费用',
    approvalNo: 'BX-2024-1108',
    approvalInProgress: true,
    approvalCompleted: false,
    flow: [
      { node: '提交 · 李娜', time: '2024-11-08 09:20', status: 'done' },
      { node: '部门审批 · 已完成', time: '2024-11-08 10:05', status: 'done' },
      { node: '财务复核 · 审批中', time: '处理人：财务部', status: 'active' },
      { node: '流程完成', time: '处理人：系统', status: 'completed' },
    ],
    pinned: false,
    actions: ['togglePin', 'detail', 'approve'],
  },
]

// 后端消息行 → 前端消息对象：与本地 mock 按 id 合并，保留图标、审批流等富字段
const TYPE_ICON = {
  todo: '/icons/approval.png',
  notice: '/icons/admin.png',
  alert: '/icons/alert.png',
}

export function formatMessageTime(createdAt) {
  const d = new Date(String(createdAt).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(createdAt)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (startOfDay === startOfToday) return hhmm
  if (startOfToday - startOfDay === 86400000) return '昨天'
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromDbMessage(row) {
  const local = INITIAL_MESSAGES.find((m) => m.id === row.id) || {}
  return {
    sender: row.source_system,
    senderFull: row.source_system,
    iconPath: TYPE_ICON[row.type] || '/icons/admin.png',
    time: formatMessageTime(row.created_at),
    actions: ['togglePin'],
    ...local,
    id: row.id,
    type: row.type,
    sourceSystem: row.source_system,
    title: row.title,
    content: row.content,
    read: !!row.is_read,
    pinned: !!row.is_pinned,
  }
}

// 已读/置顶状态回写后端
function syncMessageFlags(id, flags) {
  return fetch(apiUrl(`/api/messages/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flags),
  }).then((r) => {
    if (!r.ok) throw new Error('sync failed')
  })
}

function App() {
  const navigate = useNavigate()
  // 用一个递增数字触发 auth 变化后的重新渲染（localStorage 变化本身不会触发 React 更新）
  const [authTick, setAuthTick] = useState(0)
  const auth = getAuth()

  // 监听登录成功事件（Login.jsx 登录后派发 'auth:changed'），刷新 auth 状态
  useEffect(() => {
    const handler = () => setAuthTick((v) => v + 1)
    window.addEventListener('auth:changed', handler)
    window.addEventListener('storage', handler) // 多 tab 同步
    return () => {
      window.removeEventListener('auth:changed', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const location = useLocation()
  const [activeTab, setActiveTab] = useState('all')
  const [activeSource, setActiveSource] = useState('全部来源')
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryCollapsed, setSummaryCollapsed] = useState(false) // 摘要卡片折叠状态
  const [activeModalId, setActiveModalId] = useState(null) // 当前弹窗中的消息 id
  const [detailMessageId, setDetailMessageId] = useState(null) // 详情页消息 id
  const [showReadConfirm, setShowReadConfirm] = useState(false) // 一键已读确认弹窗
  const [showReject, setShowReject] = useState(false) // 审批驳回弹窗
  const [rejectReason, setRejectReason] = useState('信息不全')
  const [rejectNote, setRejectNote] = useState('')
  const [submittingId, setSubmittingId] = useState(null) // 正在回写审批结果的消息 id
  const [toast, setToast] = useState(null) // { type: 'success' | 'error' | 'info', text }
  const [thirdPartyMsg, setThirdPartyMsg] = useState(null) // 第三方待办提示弹窗
  const abortRef = useRef(null)
  // 打字机队列与调度状态
  const summaryQueueRef = useRef('')
  const summaryTimerRef = useRef(null)
  const summaryClockRef = useRef({ last: 0, acc: 0 })

  const modalMessage = messages.find((m) => m.id === activeModalId)
  // 弹窗中的审批消息是否已完成（完成后不再展示「同意申请」）
  const modalApprovalDone = !!modalMessage && modalMessage.type === 'todo' && !!modalMessage.approvalCompleted && !modalMessage.approvalInProgress
  const detailMessage = messages.find((m) => m.id === detailMessageId)
  // 申请人姓名（驳回提示文案中使用）
  const applicantName = detailMessage?.applicant?.split(' · ')[0] || '申请人'
  // 审批流程状态：approvalCompleted = 审批已完成；approvalInProgress = 正在审批流程中
  const isFlowCompleted = !!detailMessage?.approvalCompleted && !detailMessage?.approvalInProgress
  // 进行中场景：去掉末尾“流程完成”节点，最后一步显示为审批中
  const flowSteps = isFlowCompleted
    ? detailMessage?.flow || []
    : (() => {
        const steps = (detailMessage?.flow || []).filter((s) => s.status !== 'completed')
        return steps.map((s, i) => (i === steps.length - 1 ? { ...s, status: 'active' } : s))
      })()

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  // 首次加载：从后端拉取消息列表（失败时保留本地 mock 兜底）
  useEffect(() => {
    let cancelled = false
    fetch(apiUrl('/api/messages'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('load failed'))))
      .then((data) => {
        if (cancelled || !Array.isArray(data.messages)) return
        const merged = data.messages.map(fromDbMessage)
        setMessages([...merged.filter((m) => m.pinned), ...merged.filter((m) => !m.pinned)])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Toast 自动消失
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  const handleTogglePin = (id) => {
    const target = messages.find((m) => m.id === id)
    if (!target) return
    const pinned = !target.pinned
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, pinned } : m))
      const pinnedMsgs = next.filter((m) => m.pinned)
      const unpinnedMsgs = next.filter((m) => !m.pinned)
      return [...pinnedMsgs, ...unpinnedMsgs]
    })
    syncMessageFlags(id, { is_pinned: pinned }).catch(() =>
      showToast('error', '置顶状态同步失败')
    )
  }

  const markRead = (id) => {
    const target = messages.find((m) => m.id === id)
    if (!target || target.read) return
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)))
    syncMessageFlags(id, { is_read: true }).catch(() => {})
  }

  const showToast = (type, text) => setToast({ type, text, at: Date.now() })

  // 权限用户点击「同意」提交审批：本地待办模拟回写；第三方待办引导回原系统处理
  const submitApproval = async (id) => {
    const msg = messages.find((m) => m.id === id)
    if (!msg || submittingId) return false

    // 第三方系统待办：本地只做提醒，不直接完成
    if (msg.approvalMode === 'third') {
      setActiveModalId(null)
      setThirdPartyMsg(msg)
      return false
    }

    setSubmittingId(id)
    try {
      // 模拟审批结果回写原系统
      await new Promise((resolve) => setTimeout(resolve, 900))
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, read: true, approvalInProgress: false, approvalCompleted: true } : m
        )
      )
      syncMessageFlags(id, { is_read: true }).catch(() => {})
      showToast('success', `审批已提交，结果已同步至 ${msg.sourceSystem || '原系统'}`)
      return true
    } catch {
      showToast('error', '审批回写失败，请稍后重试')
      return false
    } finally {
      setSubmittingId(null)
    }
  }

  // 前往第三方原系统处理（演示：仅提示已跳转）
  const goThirdParty = () => {
    const source = thirdPartyMsg?.sourceSystem || '原系统'
    setThirdPartyMsg(null)
    showToast('info', `正在打开${source}原系统单据…（模拟跳转）`)
  }

  const markAllNonTodoRead = () => {
    const ids = messages.filter((m) => m.type !== 'todo' && !m.read).map((m) => m.id)
    setMessages((prev) =>
      prev.map((m) => (m.type !== 'todo' ? { ...m, read: true } : m))
    )
    ids.forEach((id) => syncMessageFlags(id, { is_read: true }).catch(() => {}))
    setShowReadConfirm(false)
  }

  // —— 打字机：SSE 分片先入队，再按固定节奏逐字渲染，避免分片过快时看起来像一次性输出 ——
  const stopSummaryTyping = () => {
    if (summaryTimerRef.current) {
      cancelAnimationFrame(summaryTimerRef.current)
      summaryTimerRef.current = null
    }
    summaryQueueRef.current = ''
    summaryClockRef.current = { last: 0, acc: 0 }
  }

  const startSummaryTyping = () => {
    if (summaryTimerRef.current) return
    const CHAR_INTERVAL = 20 // 每 20ms 吐出一个字符
    summaryClockRef.current = { last: performance.now(), acc: 0 }
    const tick = (now) => {
      const clock = summaryClockRef.current
      clock.acc += now - clock.last
      clock.last = now
      const count = Math.floor(clock.acc / CHAR_INTERVAL)
      if (count > 0 && summaryQueueRef.current) {
        clock.acc -= count * CHAR_INTERVAL
        const take = summaryQueueRef.current.slice(0, count)
        summaryQueueRef.current = summaryQueueRef.current.slice(count)
        setSummary((prev) => prev + take)
      }
      if (summaryQueueRef.current) {
        summaryTimerRef.current = requestAnimationFrame(tick)
      } else {
        summaryTimerRef.current = null
      }
    }
    summaryTimerRef.current = requestAnimationFrame(tick)
  }

  const enqueueSummary = (chunk) => {
    summaryQueueRef.current += chunk
    startSummaryTyping()
  }

  useEffect(() => () => stopSummaryTyping(), [])

  const handleGenerateSummary = async () => {
    if (summaryLoading) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    stopSummaryTyping()
    setSummary('')
    setSummaryLoading(true)
    setSummaryCollapsed(false)

    const text = messages
      .map((m) => `${m.sender}｜${m.title}｜${m.content}`)
      .join('\n')

    try {
      const response = await fetch(apiUrl('/api/summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        // 代理 502 / 后端未启动时返回的不是 JSON，给出可定位的提示
        let detail = ''
        try {
          const data = await response.json()
          detail = data?.error || ''
        } catch {
          // 非 JSON 响应，忽略解析
        }
        setSummary(detail ? `生成失败：${detail}` : '生成失败：无法连接摘要服务，请确认后端已启动后重试。')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice(5).trim()
          if (payload === '[DONE]') {
            reader.cancel().catch(() => {})
            return
          }
          try {
            const parsed = JSON.parse(payload)
            // 流式分片：入队后由打字机逐字渲染，渲染时实时解析 <hl> 高亮标签
            if (parsed.content) {
              enqueueSummary(parsed.content)
            }
            if (parsed.error) {
              enqueueSummary(`\n[错误] ${parsed.error}`)
            }
          } catch {
            // 忽略无法解析的块
          }
        }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.warn('[summary] fetch error:', err?.name, err?.message)
        enqueueSummary(`\n[请求异常] ${err.message}`)
      }
    } finally {
      if (abortRef.current === controller) {
        // 等打字机把队列播完再结束 loading，保证按钮状态与文字同步
        await new Promise((resolve) => {
          const timer = setInterval(() => {
            if (!summaryQueueRef.current) {
              clearInterval(timer)
              resolve()
            }
          }, 50)
        })
        setSummaryLoading(false)
      }
    }
  }

  // 类型 Tab + 来源系统 双重筛选
  const filteredMessages = messages.filter(
    (m) =>
      (activeTab === 'all' || m.type === activeTab) &&
      (activeSource === '全部来源' || m.sourceSystem === activeSource)
  )

  // —— 固定路由守卫：Routes 结构永不变化，避免条件渲染 Route 导致的 Router 时序问题 ——
  // 用 authTick 强制每次 auth 变化都触发 App 重新 render，守卫用最新的 auth 状态做判断
  const isAuthed = !!auth.token

  return (
    <Routes>
      {/* 登录页（放行） */}
      <Route path="/login" element={isAuthed ? <Navigate to="/" replace /> : <Login />} />

      {/* 所有受保护的页面：未登录统一 Navigate 到 /login */}
      <Route path="/" element={isAuthed ? <Workbench /> : <Navigate to="/login" replace />} />

      {/* 审批列表页 */}
      <Route path="/approvals" element={
        !isAuthed ? <Navigate to="/login" replace /> : <Approvals />
      } />

      {/* AI 摘要页面 */}
      <Route path="/summary" element={
        !isAuthed ? <Navigate to="/login" replace /> : (
        <main className="min-h-screen bg-[#F7FBFF] flex justify-center">
          <div className="w-full max-w-[450px] min-h-screen flex flex-col">
            {/* 白底顶部 */}
            <div className="bg-white">
              <div className="h-7" />
              <header className="px-4 pt-2 pb-3 relative h-11 flex items-center">
                <button onClick={() => navigate('/')} className="w-10 h-10 -ml-2 flex items-center justify-center z-10">
                  <img src="/icons/back.svg" alt="返回" className="w-[22px] h-[22px]" />
                </button>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-[#333333]">AI摘要</h1>
              </header>
            </div>

            {/* 内容区 */}
            <div className="flex-1 bg-[#F7FBFF] px-4 pt-4 pb-24 space-y-4">
              {/* 顶部 AI 卡片 */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5AA8F6] via-[#3A8EF5] to-[#2B6FD0] p-4 shadow-[0_4px_16px_rgba(58,142,245,0.25)]">
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-white/25 flex items-center justify-center shrink-0">
                    <img src="/icons/ai-summary.png" alt="AI" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-white font-semibold text-[15px]">AI智能摘要</h2>
                      <span className="text-[12px] text-white/90 bg-white/20 px-2.5 py-0.5 rounded-full">已总结</span>
                    </div>
                    <div className="mt-1.5 text-[13px] text-white/95">
                      {summary ? <p className="leading-relaxed break-words">{renderHighlightText(summary)}</p> : <p>暂无摘要内容</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 统计数字 */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '待我决策', value: 2, tone: 'bg-white', num: 'text-[#3A8EF5]', badge: null },
                  { label: '异常警报', value: 2, tone: 'bg-white', num: 'text-[#EF4444]', badge: null },
                  { label: '今日新增', value: 5, tone: 'bg-white', num: 'text-[#333333]', badge: null },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.tone} rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-center`}>
                    <div className={`text-[22px] font-bold ${stat.num}`}>{stat.value}</div>
                    <div className="text-[12px] text-[#666666] mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* 重点事项列表 */}
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-4 pt-3.5 pb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3.5 bg-[#3A8EF5] rounded-sm" />
                  <h3 className="text-[14px] font-semibold text-[#333333]">重点事项 <span className="text-[#999999] font-normal text-[12px]">（自动高亮）</span></h3>
                </div>

                {(() => {
                  const typeStyle = {
                    todo:   { dot: 'bg-[#3A8EF5]', badge: 'bg-[#EFF6FF] text-[#3A8EF5]',  label: '待决策' },
                    notice: { dot: 'bg-[#666666]', badge: 'bg-[#F3F4F6] text-[#666666]',  label: '公告' },
                    alert:  { dot: 'bg-[#F59E0B]', badge: 'bg-[#FFFBEB] text-[#F59E0B]',  label: '异常' },
                  }
                  return INITIAL_MESSAGES.slice(0, 3).map((m, i) => {
                    const s = typeStyle[m.type] || typeStyle.notice
                    return (
                      <div key={m.id} className={`px-4 py-3 ${i !== 2 ? 'border-b border-[#F1F3F5]' : ''}`}>
                        <div className="flex items-start gap-2.5">
                          <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${s.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-[#333333] leading-snug">{m.title}</p>
                            <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded ${s.badge}`}>
                              {s.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              <p className="text-center text-[12px] text-[#999999] pt-2">AI摘要仅供参考</p>
            </div>

            {/* 底部按钮 */}
            <div className="bg-white px-4 pt-3 pb-6 flex gap-3 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
              <button className="flex-1 h-11 rounded-xl border border-[#E5E7EB] text-[#333333] text-[14px] font-medium hover:bg-[#F9FAFB] transition">
                转办
              </button>
              <button className="flex-1 h-11 rounded-xl bg-[#3A8EF5] text-white text-[14px] font-medium shadow-[0_2px_8px_rgba(58,142,245,0.35)] hover:bg-[#2B6FD0] transition">
                快速批示
              </button>
            </div>
          </div>
        </main>
        )
      } />

      {/* 消息设置页面 */}
      <Route path="/settings" element={
        !isAuthed ? <Navigate to="/login" replace /> : <Settings onBack={() => navigate(-1)} />
      } />

      {/* 消息中心 */}
      <Route path="/messages" element={
        !isAuthed ? <Navigate to="/login" replace /> : (
    <main className="min-h-screen bg-[#F7FBFF] flex justify-center">
      <div className="w-full max-w-[450px] min-h-screen flex flex-col">
        {/* 白色顶部区：状态栏 + 标题栏 + Tab 导航 */}
        <div className="bg-white">
          {/* 顶部状态栏占位 */}
          <div className="h-7" />

          {/* 顶部标题栏 */}
          <header className="px-4 pt-2 pb-1">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/')} className="w-10 h-10 -ml-2 flex items-center justify-center">
              <img src="/icons/back.svg" alt="返回" className="w-[22px] h-[22px]" />
            </button>
            <div className="text-center">
              <h1 className="text-[17px] font-semibold text-[#333333] tracking-tight">消息中心</h1>
              <p className="text-[12px] text-[#999999] mt-0.5">{messages.filter((m) => !m.read).length}条未读</p>
            </div>
            <button onClick={() => navigate('/settings')} className="w-10 h-10 -mr-2 flex items-center justify-center">
              <img src="/icons/settings.svg" alt="设置" className="w-[22px] h-[22px]" />
            </button>
            </div>
          </header>

          {/* Tab 切换 — segmented control 风格 */}
          <nav className="px-4 pt-3 pb-3">
            <div className="flex gap-1 p-1 rounded-lg bg-[#F7FBFF]">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key
                const count =
                  tab.key === 'all'
                    ? null
                    : messages.filter((m) => m.type === tab.key && !m.read).length
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 h-8 rounded-lg text-[13px] transition flex items-center justify-center gap-0.5 font-medium ${
                      isActive
                        ? 'bg-white text-[#3A8EF5] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                        : 'bg-transparent text-[#333333]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {count != null && (
                      <span className={`text-[13px] font-medium ${
                        isActive ? 'text-[#3A8EF5]' : 'text-[#999999]'
                      }`}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 来源系统筛选 — 统一消息池多系统聚合 */}
            <div className="mt-2.5 flex gap-2 overflow-x-auto">
              {SOURCES.map((src) => {
                const isActive = activeSource === src
                return (
                  <button
                    key={src}
                    onClick={() => setActiveSource(src)}
                    className={`h-7 px-3 rounded-full text-[12px] shrink-0 border transition ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#3A8EF5] border-[#3A8EF5] font-medium'
                        : 'bg-[#F7FBFF] text-[#666666] border-transparent'
                    }`}
                  >
                    {src}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>

        {/* 内容区 — 浅蓝灰背景 */}
        <div className="flex-1 bg-[#F7FBFF]">
          {/* 分组标题行 */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-[#3A8EF5] rounded-[1px]" />
              <span className="text-[13px] font-semibold text-[#333333]">
                全部消息 <span className="text-[#666666] font-normal">{filteredMessages.length}条</span>
              </span>
            </div>
            <button
              onClick={() => setShowReadConfirm(true)}
              className="text-[12px] text-[#3A8EF5] hover:text-[#2B6FD0]"
            >
              一键已读非待办
            </button>
          </div>

          {/* AI 智能摘要卡片 */}
          <section className="px-4 pb-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5AA8F6] via-[#3A8EF5] to-[#2B6FD0] px-5 py-4 shadow-[0_4px_16px_rgba(58,142,245,0.25)]">
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute -right-6 bottom-[-20px] w-24 h-24 rounded-full bg-white/[0.07]" />

            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-[14px] bg-white/25 flex items-center justify-center shrink-0">
                <img src="/icons/ai-summary.png" alt="AI" className="w-6 h-6 object-contain" />
              </div>
              <h3 className="flex-1 text-white font-semibold text-[15px]">AI智能摘要</h3>
              <button
                onClick={summary ? () => setSummaryCollapsed((v) => !v) : handleGenerateSummary}
                disabled={summaryLoading}
                className="shrink-0 h-7 px-3.5 rounded-full bg-white text-[#3A8EF5] text-[12px] font-medium shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {summaryLoading ? '生成中…' : summary ? (summaryCollapsed ? '展开' : '收起') : '立即生成'}
              </button>
            </div>

            {(!summary || !summaryCollapsed) && (
              <>
                <div className="relative my-3 h-px bg-white/20" />
                {summary ? (
                  <p className="relative text-white text-[14px] leading-loose">
                    {renderHighlightText(summary)}
                    <button
                      onClick={() => navigate('/summary')}
                      className="ml-2 inline-flex h-6 items-center rounded-full bg-white px-3 align-middle text-[11px] font-medium text-[#3A8EF5] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                    >
                      查看
                    </button>
                  </p>
                ) : (
                  <p className="relative text-white/85 text-[14px] leading-loose">
                    快速提炼未读重点，重要事项一眼掌握
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* 消息列表 */}
        <section className="px-4 pb-24 space-y-2.5 flex-1">
          {filteredMessages.map((msg) => {
            const isPinned = !!msg.pinned
            const isRead = !!msg.read
            // 审批流已完成：卡片上不再展示操作按钮
            const isApprovalDone = msg.type === 'todo' && !!msg.approvalCompleted && !msg.approvalInProgress

            // 卡片整体样式：置顶=蓝框高亮；已读=透明度降低+灰线
            const cardClass = [
              'relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all',
              isPinned
                ? 'bg-white/30 border border-[#3A8EF5] shadow-[0_0_10px_rgba(58,142,245,0.2)]'
                : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
              isRead && !isPinned ? 'opacity-70' : 'opacity-100',
            ].join(' ')

            const barColor = isRead ? 'bg-[#D1D5DB]' : 'bg-[#3A8EF5]'
            const barClass = [
              'absolute left-[7px] top-1/2 -translate-y-1/2 w-[3px] h-[66px] rounded-full',
              barColor,
            ].join(' ')
            const senderColor = isRead ? 'text-[#999999]' : 'text-[#333333]'
            const titleColor = isRead ? 'text-[#999999]' : 'text-[#666666]'
            const contentColor = isRead ? 'text-[#B0B5BE]' : 'text-[#666666]'

            return (
              <article
                key={msg.id}
                onClick={() => {
                  markRead(msg.id)
                  setActiveModalId(msg.id)
                }}
                className={cardClass}
              >
                {/* 左侧竖线 */}
                <span className={barClass} />

                <div className="pl-[19px] pr-4 pt-3.5 pb-3">
                  {/* 第一行：图标 + sender + title + time */}
                  <div className="flex items-start gap-2.5">
                    {/* 图标 — 直接用 png，不加背景框 */}
                    <img src={msg.iconPath} alt={msg.sender} className="w-[46px] h-[46px] object-contain shrink-0 mt-0.5" />

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[15px] font-semibold shrink-0 ${senderColor}`}>
                          {msg.sender}
                        </span>
                        {msg.sourceSystem && (
                          <span className={`shrink-0 text-[10px] px-1.5 py-[1px] rounded ${
                            SOURCE_TAG_STYLE[msg.sourceSystem] || 'bg-[#F3F4F6] text-[#666666]'
                          }`}>
                            {msg.sourceSystem}
                          </span>
                        )}
                        <span className={`text-[14px] truncate flex-1 ${titleColor}`}>
                          {msg.title}
                        </span>
                        <span className={`text-[12px] shrink-0 ${isRead ? 'text-[#C0C4CC]' : 'text-[#999999]'}`}>
                          {msg.time}
                        </span>
                      </div>

                      {/* 第二行：内容 */}
                      <p className={`mt-1.5 text-[13px] leading-[1.55] ${contentColor}`}>
                        {msg.content}
                      </p>
                    </div>
                  </div>

                  {/* 底部按钮（审批已完成隐藏「同意」） */}
                  {msg.actions.length > 0 && (
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {msg.actions.includes('togglePin') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTogglePin(msg.id)
                          }}
                          className={`h-7 px-3 rounded-full text-[12px] transition flex items-center gap-1 ${
                            isPinned
                              ? 'text-[#3A8EF5] bg-[#EFF6FF] hover:bg-[#DBEAFE]'
                              : 'text-[#666666] bg-[#F3F4F6] hover:bg-[#E5E7EB]'
                          }`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            {isPinned ? (
                              <path d="M16 12V4h1a1 1 0 1 0 0-2H7a1 1 0 1 0 0 2h1v8l-3 3v1h5.2v6h1.6v-6H19v-1l-3-3zm-5.4 3l.4-.4V4h2v10.6l.4.4h-2.8z" transform="rotate(180 12 12)" />
                            ) : (
                              <path d="M16 12V4h1a1 1 0 1 0 0-2H7a1 1 0 1 0 0 2h1v8l-3 3v1h5.2v6h1.6v-6H19v-1l-3-3zm-5.4 3l.4-.4V4h2v10.6l.4.4h-2.8z" />
                            )}
                          </svg>
                          {isPinned ? '取消置顶' : '置顶'}
                        </button>
                      )}
                      {msg.actions.includes('detail') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markRead(msg.id)
                            setDetailMessageId(msg.id)
                          }}
                          className="h-7 px-3.5 rounded-full text-[12px] text-[#333333] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition font-medium"
                        >
                          查看详情
                        </button>
                      )}
                      {!isApprovalDone && msg.actions.includes('approve') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // 中转弹窗：先展示重要字段，再从弹窗确认或查看更多
                            markRead(msg.id)
                            setActiveModalId(msg.id)
                          }}
                          className="h-7 px-4 rounded-full text-[12px] text-white bg-[#3A8EF5] hover:bg-[#2B6FD0] transition font-medium shadow-[0_2px_6px_rgba(58,142,245,0.35)]"
                        >
                          同意
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            )
          })}

          {filteredMessages.length === 0 && (
            <div className="py-16 text-center text-[#999999] text-[14px]">
              暂无消息
            </div>
          )}
        </section>
        </div> {/* 内容区 */}
      </div> {/* max-w 容器 */}

      {/* 一键已读非待办 — 居中确认弹窗 */}
      {showReadConfirm && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40"
          onClick={() => setShowReadConfirm(false)}
        >
          <div
            className="w-[340px] bg-white rounded-[24px] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部拖拽手柄 */}
            <div className="pt-3 pb-1 flex justify-center">
              <span className="w-10 h-1 bg-[#E5E7EB] rounded-full" />
            </div>

            {/* 图标 + 标题 + 描述 */}
            <div className="px-6 pt-2 pb-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L20 7" stroke="#3A8EF5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-5 text-[17px] font-semibold text-[#333333]">标记非待办消息为已读?</h3>
              <p className="mt-2.5 text-[13px] text-[#666666] leading-[1.65]">
                是否将所有非待办消息标记为已读?此操作不会删除消息内容,待办消息不受影响。
              </p>
            </div>

            {/* 底部按钮 — 双按钮并列、大圆角、浅灰底/蓝底 */}
            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={() => setShowReadConfirm(false)}
                className="flex-1 h-12 rounded-xl bg-[#F3F4F6] text-[15px] font-medium text-[#666666] hover:bg-[#E5E7EB] transition"
              >
                取消
              </button>
              <button
                onClick={markAllNonTodoRead}
                className="flex-1 h-12 rounded-xl bg-[#3A8EF5] text-[15px] font-medium text-white hover:bg-[#2B6FD0] transition shadow-[0_2px_8px_rgba(58,142,245,0.3)]"
              >
                确认已读
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 审批回写结果 Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[95] pointer-events-none">
          <div className={`flex items-center gap-2 h-11 px-4 rounded-xl text-white text-[13px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${
            toast.type === 'success' ? 'bg-[#43CF7C]' : toast.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#3A8EF5]'
          }`}>
            {toast.type === 'success' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : toast.type === 'error' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v5M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 11v6M12 7.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* 第三方系统待办 — 引导回原系统处理 */}
      {thirdPartyMsg && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40"
          onClick={() => setThirdPartyMsg(null)}
        >
          <div
            className="w-[340px] bg-white rounded-[24px] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-3 pb-1 flex justify-center">
              <span className="w-10 h-1 bg-[#E5E7EB] rounded-full" />
            </div>

            <div className="px-6 pt-2 pb-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M14 4h6v6M20 4l-7 7" stroke="#3A8EF5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" stroke="#3A8EF5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-5 text-[17px] font-semibold text-[#333333]">
                该审批来自{thirdPartyMsg.sourceSystem}
              </h3>
              <p className="mt-2.5 text-[13px] text-[#666666] leading-[1.65]">
                跨系统待办需在{thirdPartyMsg.sourceSystem}原系统中完成审批，处理结果将自动回写至消息中心。
              </p>
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={() => setThirdPartyMsg(null)}
                className="flex-1 h-12 rounded-xl bg-[#F3F4F6] text-[15px] font-medium text-[#666666] hover:bg-[#E5E7EB] transition"
              >
                取消
              </button>
              <button
                onClick={goThirdParty}
                className="flex-1 h-12 rounded-xl bg-[#3A8EF5] text-[15px] font-medium text-white hover:bg-[#2B6FD0] transition shadow-[0_2px_8px_rgba(58,142,245,0.3)]"
              >
                前往处理
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗遮罩 */}
      {modalMessage && !detailMessage && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-[fadeIn_.15s_ease]"
          onClick={() => setActiveModalId(null)}
        >
          {/* 弹窗主体 */}
          <div
            className="w-full max-w-[430px] bg-white rounded-t-2xl pb-6 shadow-[0_-8px_32px_rgba(0,0,0,0.15)] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗顶部标题栏 */}
            <div className="sticky top-0 bg-white px-4 pt-4 pb-3 flex items-center gap-2 border-b border-[#F1F3F5]">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                modalMessage.type === 'todo' ? 'bg-[#3A8EF5] text-white' : modalMessage.type === 'notice' ? 'bg-[#F3F4F6] text-[#666666]' : 'bg-[#F59E0B] text-white'
              }`}>
                {modalMessage.type === 'todo' ? '待审批' : modalMessage.type === 'notice' ? '公告' : '预警'}
              </span>
              <span className="text-[14px] font-medium text-[#333333]">{modalMessage.sender}</span>
              {modalMessage.sourceSystem && (
                <span className={`inline-flex items-center px-1.5 py-[1px] rounded text-[10px] ${
                  SOURCE_TAG_STYLE[modalMessage.sourceSystem] || 'bg-[#F3F4F6] text-[#666666]'
                }`}>
                  {modalMessage.sourceSystem}
                </span>
              )}
              <span className="text-[12px] text-[#999999] ml-auto">{modalMessage.time}</span>
              <button
                onClick={() => setActiveModalId(null)}
                className="w-7 h-7 flex items-center justify-center text-[#999999] hover:text-[#333333] -mr-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 主题 */}
            <div className="px-4 pt-3 pb-3">
              <h3 className="text-[16px] font-semibold text-[#333333] leading-snug">
                {modalMessage.title}
              </h3>
            </div>

            {/* 内容 */}
            <div className="px-4 pb-3">
              <p className="text-[13px] text-[#333333] leading-[1.7]">
                {modalMessage.content}
              </p>
            </div>

            {/* 审批类型：金额卡片 */}
            {modalMessage.type === 'todo' && modalMessage.amount && (
              <div className="mx-4 mb-4 bg-[#F8FAFC] rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[12px] text-[#666666]">申请金额</div>
                    <div className="text-[18px] font-bold text-[#333333] mt-0.5">{modalMessage.amount}</div>
                  </div>
                  <button
                    onClick={() => {
                      setDetailMessageId(modalMessage.id)
                      setActiveModalId(null)
                    }}
                    className="text-[13px] text-[#3A8EF5] font-medium hover:text-[#2B6FD0]"
                  >
                    查看更多 →
                  </button>
                </div>
                {modalMessage.applicant && (
                  <div className="mt-2 text-[12px] text-[#666666]">
                    申请人：{modalMessage.applicant}
                  </div>
                )}
              </div>
            )}

            {/* 公告类型：查看更多 */}
            {modalMessage.type === 'notice' && modalMessage.noticeFull && modalMessage.noticeFull !== '详情内容…' && (
              <div className="px-4 pb-3">
                <button
                  onClick={() => {
                    setDetailMessageId(modalMessage.id)
                    setActiveModalId(null)
                  }}
                  className="text-[13px] text-[#3A8EF5] font-medium hover:text-[#2B6FD0]"
                >
                  查看更多 →
                </button>
              </div>
            )}

            {/* 底部按钮区 */}
            <div className="px-4 pt-3 flex gap-3">
              {modalMessage.type === 'todo' && !modalApprovalDone && (
                <>
                  <button
                    onClick={() => setActiveModalId(null)}
                    className="flex-1 h-10 rounded-xl border border-[#E5E7EB] text-[#333333] text-[14px] font-medium hover:bg-[#F9FAFB] transition"
                  >
                    稍后处理
                  </button>
                  <button
                    onClick={async () => {
                      const done = await submitApproval(modalMessage.id)
                      if (done) setActiveModalId(null)
                    }}
                    disabled={submittingId === modalMessage.id}
                    className="flex-1 h-10 rounded-xl bg-[#3A8EF5] text-white text-[14px] font-medium shadow-[0_2px_8px_rgba(58,142,245,0.35)] hover:bg-[#2B6FD0] transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submittingId === modalMessage.id ? '处理中…' : '同意申请'}
                  </button>
                </>
              )}
              {(modalMessage.type === 'notice' || modalApprovalDone) && (
                <button
                  onClick={() => setActiveModalId(null)}
                  className="flex-1 h-10 rounded-xl bg-[#3A8EF5] text-white text-[14px] font-medium shadow-[0_2px_8px_rgba(58,142,245,0.35)] hover:bg-[#2B6FD0] transition"
                >
                  我知道了
                </button>
              )}
              {modalMessage.type === 'alert' && (
                <button
                  onClick={() => setActiveModalId(null)}
                  className="flex-1 h-10 rounded-xl bg-[#3A8EF5] text-white text-[14px] font-medium shadow-[0_2px_8px_rgba(58,142,245,0.35)] hover:bg-[#2B6FD0] transition"
                >
                  我知道了
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 详情页（叠加在消息中心上层） */}
      {detailMessage && (
        <main className="fixed inset-0 z-[60] bg-[#F7FBFF] flex justify-center overflow-y-auto">
          <div className="w-full max-w-[450px] min-h-screen flex flex-col">
            {/* 白底顶部 */}
            <div className="bg-white">
              <div className="h-7" />
              <header className="px-4 pt-2 pb-3 relative h-11 flex items-center">
                <button
                  onClick={() => {
                    setDetailMessageId(null)
                    if (!activeModalId) navigate('/')
                  }}
                  className="w-10 h-10 -ml-2 flex items-center justify-center z-10"
                >
                  <img src="/icons/back.svg" alt="返回" className="w-[22px] h-[22px]" />
                </button>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-[#333333]">
                  {detailMessage.type === 'todo' ? '审批详情' : '通知详情'}
                </h1>
              </header>
            </div>

            <div className="flex-1 bg-[#F7FBFF] px-4 pt-4 pb-24 space-y-4">
              {/* 顶部 tag + 来源 */}
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
                <div className="flex items-center gap-2 text-[12px]">
                  {detailMessage.type === 'todo' ? (
                    isFlowCompleted ? (
                      <>
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-[#43CF7C] text-white">已完成</span>
                        {detailMessage.deadline && <span className="text-[#999999]">{detailMessage.deadline}</span>}
                      </>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-[#3A8EF5] text-white">待审批</span>
                    )
                  ) : detailMessage.type === 'notice' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-[#F3F4F6] text-[#666666]">公告</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-[#F59E0B] text-white">预警</span>
                  )}
                  {detailMessage.sourceSystem && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded font-medium ${
                      SOURCE_TAG_STYLE[detailMessage.sourceSystem] || 'bg-[#F3F4F6] text-[#666666]'
                    }`}>
                      来源 · {detailMessage.sourceSystem}
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-[17px] font-semibold text-[#333333] leading-snug">
                  {detailMessage.title}
                </h2>
                {detailMessage.publisher && (
                  <p className="mt-1.5 text-[13px] text-[#666666]">
                    发布人：{detailMessage.publisher}
                    {detailMessage.readCount != null && ` ｜ 阅读${detailMessage.readCount}人`}
                  </p>
                )}
              </div>

              {/* 审批详情专属：金额 + 申请人 + 审批流程 */}
              {detailMessage.type === 'todo' && (
                <>
                  <div className={`rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 ${
                    isFlowCompleted ? 'bg-[#EBF4FF]' : 'bg-white'
                  }`}>
                    <div className="text-[12px] text-[#666666]">申请金额</div>
                    <div className="mt-1 text-[22px] font-bold text-[#3A8EF5]">{detailMessage.amount}</div>
                    <div className="mt-1 text-[11px] text-[#43CF7C] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#43CF7C]" />
                      合规校验通过 · 预算内
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="grid grid-cols-2 divide-x divide-[#F1F3F5]">
                      <div className="p-4">
                        <div className="text-[12px] text-[#999999]">申请人</div>
                        <div className="mt-1 text-[14px] font-medium text-[#333333]">
                          {detailMessage.applicant}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-[12px] text-[#999999]">单据号</div>
                        <div className="mt-1 text-[14px] font-medium text-[#333333]">
                          {detailMessage.approvalNo}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-[#F1F3F5] p-4">
                      <div className="text-[12px] text-[#999999]">事由</div>
                      <div className="mt-1 text-[14px] text-[#333333]">{detailMessage.reason}</div>
                    </div>
                  </div>

                  {/* 审批流程 */}
                  {detailMessage.flow && (
                    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
                      <h3 className="text-[14px] font-semibold text-[#333333] mb-3">审批流程</h3>
                      <div className="space-y-0">
                        {flowSteps.map((step, i) => {
                          const isCompletedFlow = !!isFlowCompleted
                          const isDone = step.status === 'done' || step.status === 'completed' || isCompletedFlow
                          const color = isDone ? 'bg-[#43CF7C]' : step.status === 'active' ? 'bg-[#3A8EF5]' : 'bg-[#E5E7EB]'
                          const dotBorder = step.status === 'pending' && !isCompletedFlow ? 'border-2 border-[#E5E7EB] bg-white' : ''
                          const connectorColor = isDone ? 'bg-[#43CF7C]' : 'bg-[#E5E7EB]'
                          const isLast = i === flowSteps.length - 1
                          return (
                            <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                              <div className="flex flex-col items-center w-5 shrink-0">
                                <div className={`w-2.5 h-2.5 rounded-full ${color} ${dotBorder}`} />
                                {!isLast && (
                                  <div className={`w-[2px] flex-1 min-h-[20px] ${connectorColor} mt-1`} />
                                )}
                              </div>
                              <div className="flex-1 pt-0.5">
                                <div className={`text-[13px] ${
                                  step.status === 'pending' && !isCompletedFlow ? 'text-[#999999]' : 'text-[#333333] font-medium'
                                }`}>
                                  {step.node}
                                  {(step.status === 'completed' || (isCompletedFlow && isLast)) && (
                                    <span className="ml-2 inline-block text-[10px] px-1.5 py-[1px] rounded bg-[#E7FBF0] text-[#43CF7C]">完成</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#999999] mt-0.5">{step.time}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 流程已归档提示条（仅已完成显示） */}
                  {isFlowCompleted && (
                    <div className="rounded-2xl bg-[#EBF4FF] px-4 py-3 flex gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#3A8EF5] shrink-0 mt-0.5 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <div>
                        <div className="text-[13px] font-medium text-[#3A8EF5]">流程数据已归档</div>
                        <div className="text-[11px] text-[#666666] mt-0.5 leading-[1.5]">
                          该流程的节点、意见与操作时间已完整留存，后续状态变化将继续同步。
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 审批意见快捷项（进行中显示，已完成隐藏） */}
                  {!isFlowCompleted && (
                    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
                      <h3 className="text-[13px] font-medium text-[#333333] mb-2">审批意见（快捷选项）</h3>
                      <div className="flex gap-2 flex-wrap">
                        {['同意', '信息不全', '超预算'].map((tag) => (
                          <button
                            key={tag}
                            className={`h-8 px-3 rounded-lg text-[12px] transition ${
                              tag === '同意'
                                ? 'bg-[#EFF6FF] text-[#3A8EF5] border border-[#BFDBFE]'
                                : 'bg-[#F3F4F6] text-[#666666] border border-[#E5E7EB] hover:bg-[#E5E7EB]'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 底部按钮：已完成 → 返回消息 + 查看原系统单据 */}
                  <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white px-4 pt-3 pb-5 flex gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
                    {isFlowCompleted ? (
                      <>
                        <button
                          onClick={() => setDetailMessageId(null)}
                          className="flex-1 h-11 rounded-xl border border-[#E5E7EB] text-[#333333] text-[14px] font-medium hover:bg-[#F9FAFB] transition"
                        >
                          返回消息
                        </button>
                        <button
                          onClick={() => setDetailMessageId(null)}
                          className="flex-1 h-11 rounded-xl bg-[#3A8EF5] text-white text-[14px] font-medium shadow-[0_2px_8px_rgba(58,142,245,0.35)] hover:bg-[#2B6FD0] transition"
                        >
                          查看原系统单据
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowReject(true)}
                          className="flex-1 h-11 rounded-xl border border-[#E5E7EB] text-[#333333] text-[14px] font-medium hover:bg-[#F9FAFB] transition"
                        >
                          驳回
                        </button>
                        <button
                          onClick={() => submitApproval(detailMessage.id)}
                          disabled={submittingId === detailMessage.id}
                          className="flex-1 h-11 rounded-xl bg-[#3A8EF5] text-white text-[14px] font-medium shadow-[0_2px_8px_rgba(58,142,245,0.35)] hover:bg-[#2B6FD0] transition disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {submittingId === detailMessage.id ? '处理中…' : '同意'}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* 公告详情专属 */}
              {detailMessage.type === 'notice' && detailMessage.noticeFull && detailMessage.noticeFull !== '详情内容…' && (
                <>
                  <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
                    <p className="text-[14px] text-[#333333] leading-[1.9] whitespace-pre-wrap">
                      {detailMessage.noticeFull}
                    </p>
                  </div>

                  {/* 底部按钮 */}
                  <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white px-4 pt-3 pb-5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setDetailMessageId(null)}
                      className="w-full h-11 rounded-xl bg-[#3A8EF5] text-white text-[14px] font-medium shadow-[0_2px_8px_rgba(58,142,245,0.35)] hover:bg-[#2B6FD0] transition"
                    >
                      我知道了
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      )}

      {/* 审批驳回 — 居中确认弹窗 */}
      {showReject && detailMessage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40"
          onClick={() => setShowReject(false)}
        >
          <div
            className="w-[340px] bg-white rounded-[24px] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部拖拽手柄 */}
            <div className="pt-3 pb-1 flex justify-center">
              <span className="w-10 h-1 bg-[#E5E7EB] rounded-full" />
            </div>

            <div className="px-6 pt-1 pb-5">
              {/* 警示图标 */}
              <div className="w-12 h-12 rounded-2xl bg-[#FFF1EC] flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#FF6B4A" strokeWidth="2" />
                  <path d="M12 7.5v5" stroke="#FF6B4A" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16.2" r="1.1" fill="#FF6B4A" />
                </svg>
              </div>

              <h3 className="mt-4 text-center text-[17px] font-semibold text-[#333333]">确认驳回该申请？</h3>
              <p className="mt-2 text-center text-[13px] text-[#666666] leading-[1.65]">
                驳回后将通知申请人{applicantName}，请选择或填写理由。
              </p>

              {/* 快捷原因 */}
              <div className="mt-4 flex gap-2">
                {['信息不全', '超预算', '重复申请'].map((r) => {
                  const active = rejectReason === r
                  return (
                    <button
                      key={r}
                      onClick={() => setRejectReason(r)}
                      className={`h-8 px-3 rounded-lg text-[13px] transition ${
                        active
                          ? 'bg-[#FFF1EC] text-[#FF6B4A]'
                          : 'bg-[#F3F4F6] text-[#666666] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>

              {/* 补充说明 */}
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="补充说明（选填）"
                className="mt-3 w-full h-[88px] rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-[13px] text-[#333333] placeholder-[#B0B5BE] leading-[1.6] resize-none focus:outline-none focus:border-[#FF6B4A]"
              />

              {/* 按钮 */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowReject(false)}
                  className="flex-1 h-12 rounded-xl bg-[#F3F4F6] text-[15px] font-medium text-[#666666] hover:bg-[#E5E7EB] transition"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowReject(false)
                    setRejectNote('')
                    markRead(detailMessage.id)
                    setDetailMessageId(null)
                  }}
                  className="flex-1 h-12 rounded-xl bg-[#FF6B4A] text-[15px] font-medium text-white hover:bg-[#F2552F] transition shadow-[0_2px_8px_rgba(255,107,74,0.3)]"
                >
                  确认驳回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
        )
      } />

      {/* 兜底：未知路径 */}
      <Route path="*" element={
        isAuthed ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
      } />
    </Routes>
  )
}

export default App
