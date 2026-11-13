import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, ChevronDown, Contact, LayoutGrid, Search, Stamp, User } from 'lucide-react'
import { clearAuth, getAuth } from './Login'

const BANNERS = [
  '/banners/banner.png',
  '/banners/banner2.png',
  '/banners/banner3.png',
]

const CARD = 'bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)]'

// —— 工作台页面（enterprise-mobile-ui 规范）——
// 顶栏组织切换 · HeroBanner · 常用应用宫格 · 业务白卡栈 · 四栏底
export default function Workbench() {
  const navigate = useNavigate()
  const { user } = getAuth()
  const [bannerIndex, setBannerIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('workbench')
  const [financeOpen, setFinanceOpen] = useState(true)

  // 退出登录
  const handleLogout = () => {
    clearAuth() // 派发 auth:changed 事件，App 路由守卫会自动重定向
    navigate('/login', { replace: true })
  }

  // 自动轮播：每 4 秒切换下一张
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNERS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const quickFunctions = [
    { icon: '/icons/flow/文件移交.png', label: '文件管理' },
    { icon: '/icons/flow/事项.png', label: '发起审批' },
    { icon: '/icons/flow/会议室使用.png', label: '考勤打卡' },
    { icon: '/icons/flow/用印.png', label: '协同交流' },
    { icon: '/icons/flow/文件借阅.png', label: '今日日记' },
    { icon: '/icons/flow/台账审计.png', label: '任务管理' },
    { icon: '/icons/flow/系统权限.png', label: '智慧园区' },
  ]

  const pendingApprovals = [
    { title: '报销申请', sub: '李华 · 差旅费报销', amount: '¥2,350.00', time: '2小时前' },
  ]

  const todaySchedules = [
    { title: '原型会议', time: '10:30', location: '3号会议室' },
  ]

  const financeItems = [
    { icon: '/icons/flow/转固.png', label: '转固' },
    { icon: '/icons/flow/备用金申请.png', label: '备用金申请' },
    { icon: '/icons/flow/付款.png', label: '付款' },
    { icon: '/icons/flow/费用报销.png', label: '费用报销' },
  ]

  return (
    <div className="min-h-screen w-full bg-[#F7FBFF] flex justify-center">
      <div className="w-full max-w-[450px] min-h-screen flex flex-col bg-[#F7FBFF] pb-[66px]">
        {activeTab === 'workbench' && (
          <>
            {/* 顶栏：组织切换 · 搜索 · 消息 */}
            <header className="h-11 shrink-0 bg-white px-5 flex items-center justify-between">
              <button className="flex items-center gap-1">
                <span className="text-[17px] font-semibold text-[#323233]">贵州翔明科技</span>
                <ChevronDown size={14} color="#969799" />
              </button>
              <div className="flex items-center gap-3">
                <button className="w-8 h-8 flex items-center justify-center" aria-label="搜索">
                  <Search size={20} color="#323233" />
                </button>
                <button
                  onClick={() => navigate('/messages')}
                  className="relative w-8 h-8 flex items-center justify-center"
                  aria-label="消息中心"
                >
                  <Bell size={20} color="#323233" />
                  <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-[#FF5733]" />
                </button>
              </div>
            </header>

            <main className="flex-1 px-5 pt-5 space-y-5">
              {/* HeroBanner（自动轮播） */}
              <div className="relative rounded-2xl overflow-hidden aspect-[742/282]">
                {BANNERS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`banner-${i + 1}`}
                    className="absolute -inset-[10px] w-[calc(100%+20px)] h-[calc(100%+20px)] max-w-none object-cover transition-opacity duration-700"
                    style={{ opacity: bannerIndex === i ? 1 : 0 }}
                  />
                ))}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                  {BANNERS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        bannerIndex === i ? 'w-4 bg-[#3A8EF5]' : 'w-1.5 bg-[#C8C9CC]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* 常用应用 */}
              <section>
                <SectionHeader title="常用应用" action="更多" />
                <div className={`${CARD} p-4 grid grid-cols-4 gap-y-5`}>
                  {quickFunctions.map((f) => (
                    <AppGridItem key={f.label} {...f} />
                  ))}
                </div>
              </section>

              {/* 待我审批 */}
              <section>
                <SectionHeader title="待我审批" count={pendingApprovals.length} action="更多" />
                <div className={`${CARD} p-4`}>
                  {pendingApprovals.map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FFF7E6] flex items-center justify-center text-[16px] shrink-0">
                        💰
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[15px] font-medium text-[#323233]">{a.title}</div>
                            <div className="text-[12px] text-[#969799] mt-0.5">{a.sub}</div>
                          </div>
                          <div className="text-[12px] text-[#C8C9CC]">{a.time}</div>
                        </div>
                        <div className="mt-2 text-[13px] font-medium text-[#FF5733]">金额：{a.amount}</div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button className="px-4 h-8 rounded-full border border-[#EBEDF0] text-[13px] text-[#323233]">详情</button>
                          <button className="px-4 h-8 rounded-full border border-[#EBEDF0] text-[13px] text-[#969799]">拒绝</button>
                          <button className="px-4 h-8 rounded-full bg-[#52C41A] text-[13px] text-white">同意</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-center gap-1.5 mt-3">
                    <span className="w-4 h-1 rounded-full bg-[#3A8EF5]" />
                    <span className="w-1 h-1 rounded-full bg-[#EBEDF0]" />
                    <span className="w-1 h-1 rounded-full bg-[#EBEDF0]" />
                    <span className="w-1 h-1 rounded-full bg-[#EBEDF0]" />
                  </div>
                </div>
              </section>

              {/* 今日日程 */}
              <section>
                <SectionHeader
                  title="今日日程"
                  count={todaySchedules.length}
                  action="查看日历"
                  actionPrimary
                />
                <div className={`${CARD} p-4`}>
                  {todaySchedules.map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-[3px] self-stretch rounded-full bg-[#3A8EF5]" />
                      <div>
                        <div className="text-[14px] font-medium text-[#323233]">{s.title}</div>
                        <div className="text-[12px] text-[#969799] mt-1">{s.time} · {s.location}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-center gap-1.5 mt-3">
                    <span className="w-4 h-1 rounded-full bg-[#3A8EF5]" />
                    <span className="w-1 h-1 rounded-full bg-[#EBEDF0]" />
                    <span className="w-1 h-1 rounded-full bg-[#EBEDF0]" />
                  </div>
                </div>
              </section>

              {/* 财务（可折叠分组） */}
              <section>
                <button
                  onClick={() => setFinanceOpen((v) => !v)}
                  className="w-full flex items-center justify-between mb-3 px-1"
                >
                  <span className="text-[16px] font-semibold text-[#323233]">财务</span>
                  <ChevronDown
                    size={18}
                    color="#969799"
                    className={`transition-transform duration-200 ${financeOpen ? '' : '-rotate-90'}`}
                  />
                </button>
                {financeOpen && (
                  <div className={`${CARD} p-4 grid grid-cols-4 gap-y-5`}>
                    {financeItems.map((f) => (
                      <AppGridItem key={f.label} {...f} />
                    ))}
                  </div>
                )}
              </section>
            </main>
          </>
        )}

        {/* —— 我的 视图 —— */}
        {activeTab === 'profile' && <ProfileView user={user} onLogout={handleLogout} />}

        <BottomTabBar
          activeTab={activeTab}
          onTab={(key) => {
            if (key === 'approval') {
              navigate('/messages')
              return
            }
            if (key === 'schedule' || key === 'contacts') {
              setActiveTab('workbench')
              return
            }
            setActiveTab(key)
          }}
        />
      </div>
    </div>
  )
}

// —— 区块标题 ——
function SectionHeader({ title, count, action, actionPrimary }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-1">
        <span className="text-[16px] font-semibold text-[#323233]">{title}</span>
        {count !== undefined && <span className="text-[12px] text-[#969799]">({count})</span>}
      </div>
      {action && (
        <button className={`text-[13px] ${actionPrimary ? 'text-[#3A8EF5]' : 'text-[#969799]'}`}>
          {action}
        </button>
      )}
    </div>
  )
}

// —— 应用宫格项 ——
function AppGridItem({ icon, label }) {
  return (
    <button className="flex flex-col items-center gap-2 min-w-0">
      <img src={icon} alt={label} className="w-[52px] h-[52px]" />
      <span className="text-[12px] text-[#323233] truncate max-w-full">{label}</span>
    </button>
  )
}

// —— 底部五栏导航 ——
function BottomTabBar({ activeTab, onTab }) {
  const tabs = [
    { key: 'workbench', label: '工作台', icon: LayoutGrid },
    { key: 'approval', label: '审批', icon: Stamp },
    { key: 'schedule', label: '日程', icon: Calendar },
    { key: 'contacts', label: '通讯录', icon: Contact },
    { key: 'profile', label: '我的', icon: User },
  ]
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white border-t border-[#EBEDF0] flex z-10"
      style={{ height: 'calc(50px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((t) => {
        const Icon = t.icon
        const active = activeTab === t.key
        return (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            aria-current={active ? 'page' : undefined}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
          >
            <Icon
              size={22}
              color={active ? '#3A8EF5' : '#969799'}
              strokeWidth={active ? 2.4 : 1.8}
              fill={active && t.key === 'workbench' ? 'currentColor' : 'none'}
            />
            <span className={`text-[10px] ${active ? 'text-[#3A8EF5] font-medium' : 'text-[#969799]'}`}>
              {t.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// —— "我的" 页面 ——
function ProfileView({ user, onLogout }) {
  const groups = [
    { title: '个人中心', items: [
      { icon: '👤', label: '个人资料',   color: '#4A9DF6' },
      { icon: '💰', label: '工资条',     color: '#F59E0B' },
      { icon: '🏆', label: '绩效考核',   color: '#10B981' },
    ]},
    { title: '系统设置', items: [
      { icon: '🔔', label: '通知设置',   color: '#4A9DF6' },
      { icon: '🔒', label: '账户安全',   color: '#EF4444' },
      { icon: '🎨', label: '主题切换',   color: '#8B5CF6' },
    ]},
    { title: '帮助与支持', items: [
      { icon: '❓', label: '帮助中心',   color: '#6366F1' },
      { icon: '✉️', label: '意见反馈',   color: '#EC4899' },
      { icon: 'ℹ️', label: '关于我们',   color: '#14B8A6' },
    ]},
  ]

  const displayName = user?.username || '员工'

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-11 shrink-0 bg-white flex items-center justify-center">
        <span className="text-[17px] font-semibold text-[#323233]">我的</span>
      </div>

      <div className="flex-1 px-5 pt-5 space-y-5">
        {/* 用户信息卡 */}
        <div className={`${CARD} p-5`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#E8F3FF] text-[#3A8EF5] flex items-center justify-center text-[22px] font-semibold shrink-0">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-semibold text-[#323233] truncate">{displayName}</div>
              <div className="text-[12px] text-[#969799] mt-1">产品经理 · 产品部</div>
              <div className="text-[12px] text-[#969799] mt-0.5">员工编号：XMKJ007</div>
            </div>
          </div>
          <div className="grid grid-cols-3 mt-5 pt-4 border-t border-[#EBEDF0]">
            <DataItem value="12" label="待办事项" />
            <DataItem value="87%" label="本月出勤率" />
            <DataItem value="5.0" label="绩效评分" />
          </div>
        </div>

        {/* 分组列表 */}
        {groups.map((g) => (
          <section key={g.title}>
            <div className="text-[13px] text-[#969799] mb-2 px-1">{g.title}</div>
            <div className={`${CARD} overflow-hidden`}>
              {g.items.map((item, i) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 h-[52px] text-left ${
                    i !== g.items.length - 1 ? 'border-b border-[#EBEDF0]' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0"
                    style={{ background: `${item.color}18` }}
                  >
                    {item.icon}
                  </div>
                  <span className="flex-1 text-[15px] text-[#323233]">{item.label}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="#C8C9CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* 退出登录 */}
        <div>
          <button
            onClick={onLogout}
            className={`w-full h-11 rounded-xl bg-white text-[15px] font-medium text-[#FF5733] shadow-[0_1px_4px_rgba(0,0,0,0.04)] active:bg-[#FFF5F2] transition-colors`}
          >
            退出登录
          </button>
          <div className="text-center text-[11px] text-[#C8C9CC] mt-4">OA办公系统V3.0</div>
        </div>
      </div>
    </div>
  )
}

function DataItem({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[20px] font-semibold text-[#3A8EF5]">{value}</span>
      <span className="text-[11px] text-[#969799] mt-0.5">{label}</span>
    </div>
  )
}
