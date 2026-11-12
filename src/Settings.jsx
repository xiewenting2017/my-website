import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  Bell, BellOff, Mail, MessageSquare, AlertCircle, CheckCircle2, ChevronRight, Check,
  Volume2, Vibrate, CalendarDays, Clock, ChevronDown, ArrowDown,
  Moon, Zap,
  FileKey, ShieldAlert, Sparkles, Calendar, Smartphone, User
} from 'lucide-react'

/** 总开关锁定上下文：暂停推送时，下方所有开关置灰禁用 */
const LockContext = createContext(false)

/** 规则运算符选项 */
const RULE_OPERATORS = ['等于', '不等于', '大于', '小于', '包含']

/** 规则条件变量预设（If 构建器） */
const RULE_VARIABLES = {
  消息类型: { operators: RULE_OPERATORS, defaultValue: '审批' },
  来源系统: { operators: RULE_OPERATORS, defaultValue: '用友' },
  发起人属性: { operators: RULE_OPERATORS, defaultValue: '直属上级' },
  金额区间: { operators: RULE_OPERATORS, defaultValue: '10000' },
  紧急程度: { operators: RULE_OPERATORS, defaultValue: '紧急' },
}

/** 规则动作预设（Then 构建器） */
const RULE_ACTIONS = {
  静默存入列表: '命中后消息仍会安全保存在消息中心，不会被删除。',
  发送短信与邮件: '命中后将通过短信与邮件渠道跨端触达申请人。',
  自动转交给秘书: '命中后将自动转交给秘书处理，并回复申请人。',
  加入每日摘要: '命中后并入每日摘要集中推送，不立即提醒。',
  强制响铃提醒: '命中后将忽略静音设置，强制响铃提醒。',
}

/** Switch — 开启蓝色 bg-[#3B82F6]，关闭灰色 bg-gray-200，禁用态半透明不可点 */
function Switch({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={disabled ? undefined : onChange}
      className={`relative w-11 h-[22px] rounded-full transition-colors shrink-0 ${
        on ? 'bg-[#3B82F6]' : 'bg-gray-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-[22px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

/** 行项：左侧图标容器 + 主文本/副文本，右侧 hint + Switch */
function Row({ icon, iconBg, label, sub, hint, on, onChange }) {
  const locked = useContext(LockContext)
  // 总开关关闭时：强制回到关闭状态且不可操作
  const checked = locked ? false : on
  return (
    <div className={`flex items-center justify-between py-3 border-b border-gray-50 last:border-0 px-4 ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* 左侧图标容器 */}
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[15px] text-gray-800 truncate">{label}</div>
          {sub && <div className="text-[12px] text-gray-400 mt-0.5 truncate">{sub}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {hint && <span className="text-[12px] text-gray-400">{hint}</span>}
        {onChange && <Switch on={checked} onChange={onChange} disabled={locked} />}
      </div>
    </div>
  )
}

/** 取值行：右侧显示当前值 + 箭头（无开关），传 onClick 时可点击 */
function ValueRow({ label, value, valueClass = 'text-[13px] text-gray-400', onClick }) {
  const locked = useContext(LockContext)
  const cls = `w-full flex items-center justify-between py-3 border-b border-gray-50 last:border-0 px-4 text-left ${locked ? 'opacity-60' : ''}`
  const inner = (
    <>
      <span className="text-[15px] text-gray-800">{label}</span>
      <span className={`flex items-center gap-1 ${valueClass}`}>
        {value}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </span>
    </>
  )

  if (!onClick) return <div className={cls}>{inner}</div>

  return (
    <button type="button" onClick={locked ? undefined : onClick} disabled={locked} className={cls}>
      {inner}
    </button>
  )
}

/** 底部取值选择弹窗 */
function PickerSheet({ title, options, value, onChange, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[450px] bg-[#F4F6F8] rounded-t-2xl pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 拖拽手柄 */}
        <div className="pt-2.5 pb-1 flex justify-center">
          <span className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        {/* 标题 + 完成 */}
        <div className="relative h-11 flex items-center px-4">
          <h3 className="flex-1 text-center text-[15px] font-semibold text-[#333333]">{title}</h3>
          <button onClick={onClose} className="absolute right-4 text-[14px] font-medium text-[#3B82F6]">
            完成
          </button>
        </div>

        {/* 选项列表 */}
        <div className="mx-3 mt-2 bg-white rounded-xl overflow-hidden">
          {options.map((opt) => {
            const active = value === opt
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className="w-full h-12 px-4 flex items-center justify-between border-b border-gray-50 last:border-0 text-left"
              >
                <span className={`text-[14px] ${active ? 'text-[#3B82F6] font-medium' : 'text-[#333333]'}`}>
                  {opt}
                </span>
                {active && <Check className="w-4 h-4 text-[#3B82F6]" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** 时间选择弹窗 —— 双列滚轮样式（时 / 分） */
function TimePicker({ value, onConfirm, onCancel }) {
  const [h, m] = value.split(':').map(Number)
  const [hour, setHour] = useState(h)
  const [minute, setMinute] = useState(m)

  const pad = (n) => String(n).padStart(2, '0')
  // 中间高亮，上下各两行，循环取值
  const around = (cur, max) => [-2, -1, 0, 1, 2].map((off) => (cur + off + max) % max)

  const renderColumn = (list, onPick) =>
    list.map((v, i) => {
      const active = i === 2
      return (
        <button
          key={`${v}-${i}`}
          type="button"
          onClick={() => onPick(v)}
          className={`h-12 flex items-center justify-center tabular-nums transition-colors ${
            active
              ? 'text-[20px] font-semibold text-[#3A8EF5]'
              : i === 1 || i === 3
                ? 'text-[17px] text-[#333333]'
                : 'text-[16px] text-[#C9CDD4]'
          }`}
        >
          {pad(v)}
        </button>
      )
    })

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="w-[320px] bg-white rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
        {/* 顶栏 */}
        <div className="flex items-center justify-between px-4 h-12">
          <button onClick={onCancel} className="text-[14px] text-[#666666]">取消</button>
          <button onClick={() => onConfirm(`${pad(hour)}:${pad(minute)}`)} className="text-[14px] font-medium text-[#3A8EF5]">确定</button>
        </div>

        {/* 时 / 分 两列 */}
        <div className="relative h-[240px]">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-[#F3F7FF]" />
          <div className="relative flex h-full">
            <div className="flex-1 flex flex-col">{renderColumn(around(hour, 24), setHour)}</div>
            <div className="flex-1 flex flex-col">{renderColumn(around(minute, 60), setMinute)}</div>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}

/** 底部单选弹窗（规则构建器用） */
function OptionSheet({ title, options, value, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-[450px] bg-[#F7F8FA] rounded-t-2xl pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 拖拽手柄 */}
        <div className="pt-2.5 pb-1 flex justify-center">
          <span className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        {/* 取消 + 标题 */}
        <div className="relative h-11 flex items-center px-4">
          <button onClick={onClose} className="text-[14px] text-[#666666]">取消</button>
          <h3 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-medium text-[#333333]">{title}</h3>
        </div>

        {/* 选项 */}
        <div className="mx-3 mt-2 bg-white rounded-xl overflow-hidden">
          {options.map((opt) => {
            const active = value === opt
            return (
              <button
                key={opt}
                onClick={() => onPick(opt)}
                className="w-full h-12 px-4 flex items-center justify-between border-b border-gray-50 last:border-0 text-left"
              >
                <span className={`text-[14px] ${active ? 'text-[#3A8EF5]' : 'text-[#333333]'}`}>{opt}</span>
                {active && <Check className="w-5 h-5 text-[#3A8EF5]" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** 卡片分组 */
function CardGroup({ title, extra, children }) {
  return (
    <section>
      <div className="flex items-center justify-between mt-6 mb-2 px-1">
        <span className="text-[13px] text-gray-500">{title}</span>
        {extra && <span className="text-[12px] text-[#43CF7C]">{extra}</span>}
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {children}
      </div>
    </section>
  )
}

// 当前用户角色（暂无登录体系，固定为财务）
const CURRENT_ROLE = '财务'

export default function Settings({ onBack }) {
  const [tab, setTab] = useState('notify') // 'notify' | 'rules'

  // ======= 以下 state / toggle 逻辑保持原样，仅改 UI 层 =======
  const [paused, setPaused] = useState(false)

  const [notify, setNotify] = useState({
    smart: true, api: true, system: true, finance: false, third: false,
  })
  const [sound, setSound] = useState({
    sound: true, vibrate: true,
  })
  const [approval, setApproval] = useState({ pending: true, myFlow: true, cc: false })
  const [attendance, setAttendance] = useState({ clock: true, late: true, report: false })
  const [schedule, setSchedule] = useState({ invite: true, start: true })
  const [collab, setCollab] = useState({ task: true, interact: true })
  const [announce, setAnnounce] = useState({ company: true, system: false })
  const [dndMode, setDndMode] = useState({ timed: true, holiday: true })
  const [whitelist, setWhitelist] = useState({ urgent: true, manager: false })
  const [pref, setPref] = useState({ sync: true, aggregate: true, silentFollow: true })
  const [remind, setRemind] = useState('10分钟')
  const [freq, setFreq] = useState('每2小时')
  const [listSort, setListSort] = useState('未读优先')
  const [badge, setBadge] = useState('数字角标')
  const [keep, setKeep] = useState('90天')
  const [picker, setPicker] = useState(null) // 当前打开的取值弹窗
  const [dndTime, setDndTime] = useState({ start: '22:00', end: '08:00' })
  const [timePicker, setTimePicker] = useState(null) // 'start' | 'end' | null
  const [showNewRule, setShowNewRule] = useState(false) // 新建 / 编辑规则页
  const [editingRuleId, setEditingRuleId] = useState(null) // null = 新建
  const [newRuleName, setNewRuleName] = useState('')
  const [condMode, setCondMode] = useState('且')
  // IF 条件（支持多条件 And/Or 组合）
  const [conditions, setConditions] = useState([
    { id: 1, variable: '来源系统', operator: '等于', value: '用友' },
    { id: 2, variable: '金额区间', operator: '大于', value: '10000' },
  ])
  const [varPickerId, setVarPickerId] = useState(null) // 变量选择弹窗对应的条件 id
  const [opPickerId, setOpPickerId] = useState(null) // 运算符选择弹窗对应的条件 id
  const [action, setAction] = useState('静默存入列表') // THEN 动作
  const [actionPicker, setActionPicker] = useState(false)

  // 自定义规则卡片（已启用规则）
  const [ruleCards, setRuleCards] = useState([
    {
      id: 1, scope: '个人规则', title: '小额财务静默汇总',
      desc: '用友财务 · 金额低于 ¥5,000 — 18:00聚合推送',
      hits: 28, last: '今天14:23', on: true,
    },
    {
      id: 2, scope: '个人规则', title: '直属领导消息强提醒',
      desc: '发起人为直属领导 · 强制响铃并发送短信',
      hits: 6, last: '昨天16:40', on: true,
    },
    {
      id: 3, scope: '组织规则', title: '高额财务预警',
      desc: '用友财务 · 金额低于 ¥5,000 — 18:00聚合推送',
      hits: 12, last: '今天09:18', on: true,
    },
  ])

  const toggle = (setter, key) => () => setter((s) => ({ ...s, [key]: !s[key] }))
  // ========= 逻辑结束 =========

  // —— 全局保存机制：与已保存快照对比，判断是否有修改 ——
  const snapshot = JSON.stringify({ paused, notify, sound, approval, attendance, schedule, collab, announce, dndMode, whitelist, pref, remind, freq, listSort, badge, keep, dndTime, ruleCards })
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot)
  const dirty = snapshot !== savedSnapshot
  const [toast, setToast] = useState(null) // null | { type: 'success' | 'error', text: string }
  // 远端配置是否已加载（加载完成后需要重置保存快照）
  const [loaded, setLoaded] = useState(false)
  // 已保存快照的 ref 镜像，供失败回滚时取最新基准（避免闭包旧值）
  const savedSnapshotRef = useRef(snapshot)
  // 自动保存防抖定时器
  const saveTimerRef = useRef(null)

  // 把远端 prefs 对象应用到本地所有 state（加载与失败回滚共用）
  const applyPrefs = (p) => {
    if (!p || typeof p !== 'object') return
    if (p.paused !== undefined) setPaused(p.paused)
    if (p.notify) setNotify(p.notify)
    if (p.sound) setSound(p.sound)
    if (p.approval) setApproval(p.approval)
    if (p.attendance) setAttendance(p.attendance)
    if (p.schedule) setSchedule(p.schedule)
    if (p.collab) setCollab(p.collab)
    if (p.announce) setAnnounce(p.announce)
    if (p.dndMode) setDndMode(p.dndMode)
    if (p.whitelist) setWhitelist(p.whitelist)
    if (p.pref) setPref(p.pref)
    if (p.remind !== undefined) setRemind(p.remind)
    if (p.freq !== undefined) setFreq(p.freq)
    if (p.listSort !== undefined) setListSort(p.listSort)
    if (p.badge !== undefined) setBadge(p.badge)
    if (p.keep !== undefined) setKeep(p.keep)
    if (p.dndTime) setDndTime(p.dndTime)
    if (Array.isArray(p.ruleCards)) setRuleCards(p.ruleCards)
  }

  // 由快照字符串构造保存请求体
  const buildBody = (snap) => {
    const p = JSON.parse(snap)
    return {
      app_push_enabled: p.notify.api,
      dnd_enabled: p.dndMode.timed,
      dnd_start: p.dndTime.start,
      dnd_end: p.dndTime.end,
      prefs: p,
    }
  }

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 2000)
  }

  const updateSavedSnapshot = (snap) => {
    savedSnapshotRef.current = snap
    setSavedSnapshot(snap)
  }

  // 拨动即保存：把快照 POST 到后端，失败则回滚到上次已保存的快照
  const saveSettings = async (snap) => {
    try {
      const r = await fetch(`/api/settings/${encodeURIComponent(CURRENT_ROLE)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(snap)),
      })
      if (!r.ok) throw new Error('save failed')
      updateSavedSnapshot(snap)
      showToast('success', '保存成功')
    } catch {
      // 保存失败：回滚到上次已保存的快照
      applyPrefs(JSON.parse(savedSnapshotRef.current))
      showToast('error', '保存失败')
    }
  }

  // 首次加载：从后端拉取当前角色的偏好设置（含其余设置的 JSON 快照）
  useEffect(() => {
    let cancelled = false
    fetch(`/api/settings/${encodeURIComponent(CURRENT_ROLE)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('load failed'))))
      .then((data) => {
        if (cancelled || !data.settings) return
        const s = data.settings
        applyPrefs(s.prefs)
        // 独立列为准的 4 个关键字段
        setNotify((prev) => ({ ...prev, api: !!s.app_push_enabled }))
        setDndMode((prev) => ({ ...prev, timed: !!s.dnd_enabled }))
        setDndTime({ start: s.dnd_start, end: s.dnd_end })
        setLoaded(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 远端配置应用完毕后，以其为新的保存基准
  useEffect(() => {
    if (loaded) updateSavedSnapshot(snapshot)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  // 自动保存：快照变化后 500ms 防抖触发
  useEffect(() => {
    if (!loaded || snapshot === savedSnapshot) return undefined
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      saveSettings(snapshot)
    }, 500)
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, savedSnapshot, loaded])

  const handleSave = async () => {
    if (!dirty) {
      // 自动保存通常已抢先保存，直接提示即可
      showToast('success', '保存成功')
      return
    }
    // 跳过防抖，立即保存
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    await saveSettings(snapshot)
  }

  const handleSaveNewRule = () => {
    const name = newRuleName.trim() || '未命名规则'
    const desc = `自定义条件（${condMode}）· ${action}`
    if (editingRuleId) {
      // 编辑已有规则
      setRuleCards((prev) =>
        prev.map((r) =>
          r.id === editingRuleId ? { ...r, title: name, desc } : r
        )
      )
    } else {
      setRuleCards((prev) => [
        ...prev,
        {
          id: Date.now(),
          scope: '个人规则',
          title: name,
          desc,
          hits: 0,
          last: '刚刚',
          on: true,
        },
      ])
    }
    setNewRuleName('')
    setEditingRuleId(null)
    setShowNewRule(false)
    setTab('rules')
  }

  // 打开规则编辑页
  const openRuleEditor = (rule) => {
    setEditingRuleId(rule.id)
    setNewRuleName(rule.title)
    setShowNewRule(true)
  }

  // 切换条件变量时，同步重置运算符与默认值
  const changeVariable = (id, variable) => {
    const preset = RULE_VARIABLES[variable]
    setConditions((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, variable, operator: preset.operators[0], value: preset.defaultValue } : c
      )
    )
  }

  // 追加一条条件
  const addCondition = () => {
    const preset = RULE_VARIABLES['来源系统']
    setConditions((prev) => [
      ...prev,
      { id: Date.now(), variable: '来源系统', operator: preset.operators[0], value: preset.defaultValue },
    ])
  }

  // —— 新建规则页 ——
  if (showNewRule) {
    const selectBox = 'flex-1 h-9 rounded-lg border border-gray-200 flex items-center justify-between px-2.5 text-[13px] text-[#333333]'
    return (
      <main className="min-h-screen bg-white flex justify-center">
        <div className="w-full max-w-[450px] min-h-screen flex flex-col">
          {/* 顶部导航栏 */}
          <div className="bg-white">
            <div className="h-7" />
            <header className="px-4 pt-2 pb-3 flex items-center">
              <button
                onClick={() => {
                  setShowNewRule(false)
                  setEditingRuleId(null)
                }}
                className="w-10 h-10 -ml-2 flex items-center justify-center"
              >
                <img src="/icons/back.svg" alt="返回" className="w-[22px] h-[22px]" />
              </button>
              <h1 className="flex-1 text-center text-[17px] font-semibold text-[#333333] -ml-4">
                {editingRuleId ? '编辑规则' : '新建规则'}
              </h1>
              <button onClick={handleSaveNewRule} className="text-[14px] font-medium text-[#3B82F6] hover:text-[#2563EB] pr-1">
                保存
              </button>
            </header>
          </div>

          <div className="flex-1 px-4 pt-2 pb-28">
            {/* 规则名称 */}
            <div className="rounded-xl border border-gray-100 px-3 py-3">
              <div className="text-[12px] text-gray-400">规则名称</div>
              <input
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="请输入规则名称"
                className="mt-1.5 w-full text-[15px] text-[#333333] placeholder-[#C9CDD4] outline-none"
              />
            </div>

            {/* IF 条件区 */}
            <div className="mt-4 rounded-2xl bg-[#EDF4FF] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-[#3A8EF5] text-white text-[11px] font-semibold rounded px-1.5 py-0.5">IF</span>
                  <span className="text-[13px] text-[#333333]">满足以下条件</span>
                </div>
                <div className="flex items-center gap-1">
                  {['且', '或'].map((m) => {
                    const active = condMode === m
                    return (
                      <button
                        key={m}
                        onClick={() => setCondMode(m)}
                        className={`w-7 h-6 rounded text-[12px] transition ${
                          active ? 'bg-[#3A8EF5] text-white' : 'bg-white text-[#3A8EF5]'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-3 bg-white rounded-xl p-3">
                {conditions.map((c, i) => (
                  <div key={c.id}>
                    {/* 条件之间的连接符 */}
                    {i > 0 && (
                      <div className="my-2">
                        <span className="inline-block bg-[#EAF2FF] text-[#3A8EF5] text-[11px] font-semibold rounded px-1.5 py-0.5">
                          {condMode === '且' ? 'AND' : 'OR'}
                        </span>
                      </div>
                    )}

                    {/* 变量 / 运算符 */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVarPickerId(c.id)}
                        className={selectBox}
                      >
                        {c.variable}
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpPickerId(c.id)}
                        className={selectBox}
                      >
                        {c.operator}
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>

                    {/* 值输入 */}
                    <div className="mt-2 h-9 rounded-lg border border-gray-200 flex items-center px-2.5 text-[13px] text-[#333333]">
                      <input
                        value={c.value}
                        onChange={(e) =>
                          setConditions((prev) =>
                            prev.map((x) => (x.id === c.id ? { ...x, value: e.target.value } : x))
                          )
                        }
                        inputMode={c.variable === '金额区间' ? 'numeric' : 'text'}
                        className="w-full outline-none bg-transparent"
                      />
                    </div>
                  </div>
                ))}

                {/* 添加条件 */}
                <button
                  onClick={addCondition}
                  className="mt-3 w-full h-9 rounded-lg border border-dashed border-[#9CC3F5] bg-[#F7FBFF] text-[13px] text-[#3A8EF5]"
                >
                  + 添加条件
                </button>
              </div>
            </div>

            {/* 过渡箭头 */}
            <div className="my-3 flex justify-center">
              <div className="w-8 h-8 rounded-full bg-[#EAF2FF] flex items-center justify-center">
                <ArrowDown className="w-4 h-4 text-[#3A8EF5]" />
              </div>
            </div>

            {/* THEN 动作区 */}
            <div className="rounded-2xl bg-[#EEF9F0] p-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#5AC97B] text-white text-[11px] font-semibold rounded px-1.5 py-0.5">THEN</span>
                <span className="text-[13px] text-[#333333]">执行以下动作</span>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setActionPicker(true)}
                  className="w-full h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-between px-3 text-[13px] text-[#333333]"
                >
                  {action}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <div className="rounded-lg bg-[#E8F6EA] px-3 py-2.5 text-[12px] text-[#7C8A80] leading-[1.6]">
                  {RULE_ACTIONS[action]}
                </div>
                <button className="w-full h-9 rounded-lg border border-dashed border-[#9CC3F5] bg-[#F7FBFF] text-[13px] text-[#3A8EF5]">
                  模拟测试规则
                </button>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white px-4 pt-3 pb-5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewRule(false)
                  setEditingRuleId(null)
                }}
                className="flex-1 h-12 rounded-xl bg-[#F3F4F6] text-[15px] font-medium text-[#666666] hover:bg-[#E5E7EB] transition"
              >
                取消
              </button>
              <button
                onClick={handleSaveNewRule}
                className="flex-1 h-12 rounded-xl bg-[#3A8EF5] text-[15px] font-medium text-white shadow-[0_2px_8px_rgba(58,142,245,0.35)] hover:bg-[#2B6FD0] transition"
              >
                保存并启用
              </button>
            </div>
          </div>

          {/* 变量选择弹窗 */}
          {varPickerId !== null && (
            <OptionSheet
              title="来源"
              options={Object.keys(RULE_VARIABLES)}
              value={conditions.find((c) => c.id === varPickerId)?.variable}
              onPick={(v) => {
                changeVariable(varPickerId, v)
                setVarPickerId(null)
              }}
              onClose={() => setVarPickerId(null)}
            />
          )}

          {/* 运算符选择弹窗 */}
          {opPickerId !== null && (
            <OptionSheet
              title="条件"
              options={RULE_VARIABLES[conditions.find((c) => c.id === opPickerId)?.variable]?.operators || []}
              value={conditions.find((c) => c.id === opPickerId)?.operator}
              onPick={(v) => {
                setConditions((prev) => prev.map((c) => (c.id === opPickerId ? { ...c, operator: v } : c)))
                setOpPickerId(null)
              }}
              onClose={() => setOpPickerId(null)}
            />
          )}

          {/* 动作选择弹窗 */}
          {actionPicker && (
            <OptionSheet
              title="动作"
              options={Object.keys(RULE_ACTIONS)}
              value={action}
              onPick={(v) => {
                setAction(v)
                setActionPicker(false)
              }}
              onClose={() => setActionPicker(false)}
            />
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F4F6F8] flex justify-center">
      <div className="w-full max-w-[450px] min-h-screen flex flex-col">
        {/* 顶部导航栏 */}
        <div className="bg-white">
          <div className="h-7" />
          <header className="px-4 pt-2 pb-3 flex items-center">
            <button onClick={onBack} className="w-10 h-10 -ml-2 flex items-center justify-center">
              <img src="/icons/back.svg" alt="返回" className="w-[22px] h-[22px]" />
            </button>
            <h1 className="flex-1 text-center text-[17px] font-semibold text-[#333333] -ml-4">消息设置</h1>
            <button className="text-[14px] font-medium text-[#3B82F6] hover:text-[#2563EB] pr-1">保存</button>
          </header>
        </div>

        {/* 双 Tab 切换 —— 与首页消息中心 segmented control 完全一致 */}
        <nav className="bg-white px-4 pt-3 pb-3">
          <div className="flex gap-1 p-1 rounded-lg bg-[#F7FBFF]">
            {[
              { key: 'notify', label: '通知偏好' },
              { key: 'rules',  label: '自定义规则' },
            ].map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 h-8 rounded-lg text-[13px] font-medium transition flex items-center justify-center ${
                    active
                      ? 'bg-white text-[#3B82F6] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'bg-transparent text-[#666666]'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* 主体内容 */}
        <div className="flex-1 bg-[#F4F6F8] px-4 pt-3 pb-28">
          <LockContext.Provider value={paused}>
          {tab === 'notify' && (
            <>
          {/* 顶部：暂停所有消息推送 卡片 */}
          <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                paused ? 'bg-gray-400' : 'bg-[#3B82F6]'
              }`}>
                {paused ? (
                  <BellOff className="w-6 h-6 text-white" />
                ) : (
                  <Bell className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <div className="text-[15px] font-semibold text-gray-900">
                  {paused ? '已暂停消息推送' : '暂停所有消息推送'}
                </div>
                <div className="text-[12px] text-gray-400 mt-1">
                  {paused ? '点击恢复所有消息接收' : '开启后将暂不接收任何消息'}
                </div>
              </div>
            </div>
            <Switch on={paused} onChange={() => setPaused((p) => !p)} />
          </div>

          {/* 强提示 */}
          <div className="flex items-center gap-1.5 mt-2 px-1">
            <AlertCircle className="w-3.5 h-3.5 text-[#FF8D1A] shrink-0" />
            <span className="text-[12px] text-[#FF8D1A]">关闭后仍会保留应用内红点</span>
          </div>
            </>
          )}

          {tab === 'notify' && (
            <>
              {/* ===== 接收渠道（按用户提供参考图精调） ===== */}
              <CardGroup title="接收渠道">
                <Row
                  icon={<Mail className="w-4 h-4 text-[#3B82F6]" />}
                  iconBg="bg-blue-500/10"
                  label="APP内推送"
                  on={notify.smart} onChange={toggle(setNotify, 'smart')}
                />
                <Row
                  icon={<Bell className="w-4 h-4 text-violet-500" />}
                  iconBg="bg-violet-500/10"
                  label="系统通知栏"
                  on={notify.api} onChange={toggle(setNotify, 'api')}
                />
                <Row
                  icon={<MessageSquare className="w-4 h-4 text-orange-500" />}
                  iconBg="bg-orange-500/10"
                  label="短信通知"
                  sub="仅用于超期预警等紧急流程"
                  on={notify.system} onChange={toggle(setNotify, 'system')}
                />
                <Row
                  icon={<Mail className="w-4 h-4 text-emerald-500" />}
                  iconBg="bg-emerald-500/10"
                  label="邮件通知"
                  on={notify.finance} onChange={toggle(setNotify, 'finance')}
                />
                <Row
                  icon={<Sparkles className="w-4 h-4 text-teal-500" />}
                  iconBg="bg-teal-500/10"
                  label="第三方应用推送"
                  sub="企业微信、钉钉、飞书"
                  on={notify.third} onChange={toggle(setNotify, 'third')}
                />
              </CardGroup>

              {/* ===== 提醒方式 ===== */}
              <CardGroup title="提醒方式">
                <Row
                  icon={<Volume2 className="w-4 h-4 text-[#3B82F6]" />}
                  iconBg="bg-blue-500/10"
                  label="声音"
                  on={sound.sound} onChange={toggle(setSound, 'sound')}
                />
                <Row
                  icon={<Vibrate className="w-4 h-4 text-violet-500" />}
                  iconBg="bg-violet-500/10"
                  label="震动"
                  on={sound.vibrate} onChange={toggle(setSound, 'vibrate')}
                />
              </CardGroup>

              {/* ===== 审批流程 ===== */}
              <CardGroup title="审批流程">
                <Row
                  label="待我审批提醒"
                  on={approval.pending} onChange={toggle(setApproval, 'pending')}
                />
                <Row
                  label="我发起的流程状态变更"
                  sub="通过、驳回或被撤销"
                  on={approval.myFlow} onChange={toggle(setApproval, 'myFlow')}
                />
                <Row
                  label="抄送我的流程"
                  on={approval.cc} onChange={toggle(setApproval, 'cc')}
                />
              </CardGroup>

              {/* ===== 考勤打卡 ===== */}
              <CardGroup title="考勤打卡">
                <Row
                  label="上下班打卡提醒"
                  on={attendance.clock} onChange={toggle(setAttendance, 'clock')}
                />
                <ValueRow label="提前提醒" value={remind} onClick={() => setPicker('remind')} />
                <Row
                  label="缺卡、迟到、早退提醒"
                  on={attendance.late} onChange={toggle(setAttendance, 'late')}
                />
                <Row
                  label="考勤日报与周报"
                  on={attendance.report} onChange={toggle(setAttendance, 'report')}
                />
              </CardGroup>

              {/* ===== 日程与会议 ===== */}
              <CardGroup title="日程与会议">
                <Row
                  label="会议邀请、变更与取消"
                  on={schedule.invite} onChange={toggle(setSchedule, 'invite')}
                />
                <Row
                  label="日程开始提醒"
                  on={schedule.start} onChange={toggle(setSchedule, 'start')}
                />
                <ValueRow label="提醒时间" value="15分钟" />
              </CardGroup>

              {/* ===== 协同与任务 ===== */}
              <CardGroup title="协同与任务">
                <Row
                  label="任务动态"
                  sub="分配、完成或延期"
                  on={collab.task} onChange={toggle(setCollab, 'task')}
                />
                <Row
                  label="协作互动"
                  sub="@我、评论回复、文件共享"
                  on={collab.interact} onChange={toggle(setCollab, 'interact')}
                />
              </CardGroup>

              {/* ===== 公告与系统 ===== */}
              <CardGroup title="公告与系统">
                <Row
                  label="公司公告与部门通知"
                  on={announce.company} onChange={toggle(setAnnounce, 'company')}
                />
                <Row
                  label="系统更新与维护"
                  on={announce.system} onChange={toggle(setAnnounce, 'system')}
                />
              </CardGroup>

              {/* ===== 免打扰模式 ===== */}
              <CardGroup title="免打扰模式">
                <Row
                  icon={<Clock className="w-4 h-4 text-violet-500" />}
                  iconBg="bg-violet-500/10"
                  label="定时免打扰"
                  sub="普通消息静默存入列表"
                  on={dndMode.timed} onChange={toggle(setDndMode, 'timed')}
                />
                <div className="px-4 pb-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <div className="text-[12px] text-gray-400 text-center mb-1.5">开始</div>
                      <button
                        type="button"
                        onClick={() => setTimePicker('start')}
                        className="w-full h-10 rounded-lg border border-gray-200 flex items-center justify-between px-3"
                      >
                        <span className="text-[14px] text-gray-800">{dndTime.start}</span>
                        <Clock className="w-4 h-4 text-gray-300" />
                      </button>
                    </div>
                    <span className="text-[13px] text-gray-300 pb-2.5">—</span>
                    <div className="flex-1">
                      <div className="text-[12px] text-gray-400 text-center mb-1.5">结束</div>
                      <button
                        type="button"
                        onClick={() => setTimePicker('end')}
                        className="w-full h-10 rounded-lg border border-gray-200 flex items-center justify-between px-3"
                      >
                        <span className="text-[14px] text-gray-800">{dndTime.end}</span>
                        <Clock className="w-4 h-4 text-gray-300" />
                      </button>
                    </div>
                  </div>
                </div>
                <Row
                  icon={<CalendarDays className="w-4 h-4 text-emerald-500" />}
                  iconBg="bg-emerald-500/10"
                  label="节假日免打扰"
                  sub="自动同步周末与法定节假日"
                  on={dndMode.holiday} onChange={toggle(setDndMode, 'holiday')}
                />
              </CardGroup>

              {/* ===== 免打扰白名单 ===== */}
              <CardGroup title="免打扰白名单" extra="可突破静默">
                <Row
                  icon={<ShieldAlert className="w-4 h-4 text-amber-500" />}
                  iconBg="bg-amber-500/10"
                  label="紧急消息"
                  sub="含超期预警与紧急公告"
                  on={whitelist.urgent} onChange={toggle(setWhitelist, 'urgent')}
                />
                <Row
                  icon={<User className="w-4 h-4 text-violet-500" />}
                  iconBg="bg-violet-500/10"
                  label="直属上级"
                  sub="来自直属上级的流程与消息"
                  on={whitelist.manager} onChange={toggle(setWhitelist, 'manager')}
                />
              </CardGroup>

              {/* ===== 接收偏好与防打扰 ===== */}
              <CardGroup title="接收偏好与防打扰">
                <Row
                  label="多端同步与去重"
                  sub="PC端活跃时，手机仅显示极简提示"
                  on={pref.sync} onChange={toggle(setPref, 'sync')}
                />
                <Row
                  label="消息聚合推送"
                  sub="将非紧急消息合并发送"
                  on={pref.aggregate} onChange={toggle(setPref, 'aggregate')}
                />
                <ValueRow label="聚合频率" value={freq} onClick={() => setPicker('freq')} />
                <Row
                  label="静默关注"
                  sub="关注流程仅接收最终结果"
                  on={pref.silentFollow} onChange={toggle(setPref, 'silentFollow')}
                />
              </CardGroup>

              {/* ===== 应用内提示 ===== */}
              <CardGroup title="应用内提示">
                <ValueRow label="消息列表排序" value={listSort} valueClass="text-[15px] text-[#666666]" onClick={() => setPicker('sort')} />
                <ValueRow label="红点提示规则" value={badge} valueClass="text-[15px] text-[#666666]" onClick={() => setPicker('badge')} />
                <ValueRow label="已读消息保留" value={keep} valueClass="text-[15px] text-[#666666]" onClick={() => setPicker('keep')} />
              </CardGroup>

              <p className="text-center text-[12px] text-gray-400 pt-4">
                设置仅作用于当前账号，并将在你的所有设备间同步
              </p>
            </>
          )}

          {tab === 'rules' && (
            <>
              <div className="text-[13px] text-gray-500 mt-4 mb-2 px-1">已启用规则</div>

              {ruleCards.map((rule) => {
                const isOrg = rule.scope === '组织规则'
                return (
                  <div
                    key={rule.id}
                    onClick={() => openRuleEditor(rule)}
                    className="bg-white rounded-2xl shadow-sm px-4 pt-4 pb-3 mb-3 cursor-pointer hover:shadow-md transition"
                  >
                    {/* 标题行 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[12px] px-2 py-0.5 rounded-md ${isOrg ? 'bg-[#FFF3E6] text-[#FF8D1A]' : 'bg-[#EAF2FF] text-[#3A8EF5]'}`}>
                          {rule.scope}
                        </span>
                        <span className="text-[15px] font-medium text-[#333333]">{rule.title}</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          on={rule.on}
                          onChange={() => setRuleCards((prev) => prev.map((r) => (r.id === rule.id ? { ...r, on: !r.on } : r)))}
                        />
                      </div>
                    </div>

                    {/* 规则描述 */}
                    <p className="mt-2 text-[13px] text-[#999999] leading-[1.6]">{rule.desc}</p>

                    {/* 命中统计 */}
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[12px] text-[#B0B5BE]">
                      <span>近期命中 {rule.hits} 次</span>
                      <span>最近:{rule.last}</span>
                    </div>
                  </div>
                )
              })}
            </>
          )}
          </LockContext.Provider>
        </div>

        {/* Toast 提示 */}
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] transition-all duration-300 ${
            toast?.type === 'error' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-black/75 text-white'
          } ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
        >
          {toast?.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#43CF7C]" />
          )}
          {toast?.text ?? '保存成功'}
        </div>

        {/* 取值选择弹窗 */}
        {picker === 'remind' && (
          <PickerSheet
            title="打卡提醒时间"
            options={['准时提醒', '提前5分钟', '10分钟', '15分钟', '30分钟']}
            value={remind}
            onChange={setRemind}
            onClose={() => setPicker(null)}
          />
        )}
        {picker === 'freq' && (
          <PickerSheet
            title="聚合推送频率"
            options={['每1小时', '每2小时', '每4小时', '每天2次', '每天3次']}
            value={freq}
            onChange={setFreq}
            onClose={() => setPicker(null)}
          />
        )}
        {picker === 'sort' && (
          <PickerSheet
            title="消息列表排序"
            options={['最新时间', '未读优先', '重要优先']}
            value={listSort}
            onChange={setListSort}
            onClose={() => setPicker(null)}
          />
        )}
        {picker === 'badge' && (
          <PickerSheet
            title="红点提示规则"
            options={['数字角标', '仅显示红点', '不显示']}
            value={badge}
            onChange={setBadge}
            onClose={() => setPicker(null)}
          />
        )}
        {picker === 'keep' && (
          <PickerSheet
            title="已读消息保留期限"
            options={['30天', '90天', '180天', '永久保留']}
            value={keep}
            onChange={setKeep}
            onClose={() => setPicker(null)}
          />
        )}

        {/* 定时免打扰 — 时间选择弹窗 */}
        {timePicker && (
          <TimePicker
            value={dndTime[timePicker]}
            onConfirm={(v) => {
              setDndTime((prev) => ({ ...prev, [timePicker]: v }))
              setTimePicker(null)
            }}
            onCancel={() => setTimePicker(null)}
          />
        )}

        {/* 底部全宽按钮：通知偏好为「保存设置」，自定义规则为「新建规则」 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white px-4 pt-3 pb-5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          {tab === 'rules' ? (
            <button
              onClick={() => setShowNewRule(true)}
              className="w-full h-11 rounded-xl text-[15px] font-medium text-white bg-[#3A8EF5] shadow-[0_2px_8px_rgba(58,142,245,0.35)] hover:bg-[#2B6FD0] transition"
            >
              新建规则
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!dirty}
              className={`w-full h-11 rounded-xl text-[15px] font-medium text-white transition ${
                dirty
                  ? 'bg-[#3B82F6] shadow-[0_2px_8px_rgba(59,130,246,0.35)] hover:bg-[#2563EB]'
                  : 'bg-[#3B82F6]/40 cursor-not-allowed'
              }`}
            >
              保存设置
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
