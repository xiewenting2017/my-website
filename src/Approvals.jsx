import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Contact, FilePlus, LayoutGrid, Search, Stamp, User } from 'lucide-react'

const FILTER_TABS = [
  { key: 'all', label: '全部状态' },
  { key: 'recent', label: '最近30天' },
  { key: 'latest', label: '最新优先' },
]

const STATUS_STYLE = {
  pending:  { text: '待审批', bg: 'bg-[#FFF7E6]', fg: 'text-[#FA8C16]' },
  approved: { text: '已通过', bg: 'bg-[#F6FFED]', fg: 'text-[#52C41A]' },
  rejected: { text: '已拒绝', bg: 'bg-[#FFF1F0]', fg: 'text-[#FF4D4F]' },
}

// 审批卡片 mock 数据
const APPROVALS = [
  {
    id: 1,
    type: '报销申请',
    icon: '/icons/flow/expense-claim.png',
    time: '2小时前',
    applicant: '李华 · 差旅费报销',
    detail: '金额：¥2,350.00',
    status: 'pending',
    hasAttachment: true,
  },
  {
    id: 2,
    type: '请假申请',
    icon: '/icons/flow/leave.png',
    time: '2小时前',
    applicant: '王芳 · 年假',
    detail: '时间：3天（10.16-10.18）',
    status: 'approved',
    hasAttachment: true,
  },
  {
    id: 3,
    type: '出差申请',
    icon: '/icons/flow/business-trip.png',
    time: '昨天',
    applicant: '张伟 · 北京出差',
    detail: '时间：5天（10.20-10.24）',
    status: 'rejected',
    hasAttachment: true,
  },
  {
    id: 4,
    type: '请假申请',
    icon: '/icons/flow/leave.png',
    time: '10-11',
    applicant: '陈明 · 病假',
    detail: '时间：1天',
    status: 'approved',
    hasAttachment: false,
  },
  {
    id: 5,
    type: '文件审批',
    icon: '/icons/flow/seal.png',
    time: '10-10',
    applicant: '赵强 · 合同审批',
    detail: '用印申请',
    status: 'pending',
    hasAttachment: true,
  },
]

export default function Approvals() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('approval')

  const filtered = APPROVALS.filter((a) => {
    if (filter === 'pending') return a.status === 'pending'
    return true
  })

  return (
    <div className="min-h-screen w-full bg-[#F7FBFF] flex justify-center">
      <div className="w-full max-w-[450px] min-h-screen flex flex-col bg-[#F7FBFF] pb-[66px]">
        {/* 顶部白色区 */}
        <div className="bg-white">
          <div className="h-7" />
          <header className="px-5 pt-2 pb-3 flex items-center justify-between">
            <div className="w-8" />
            <h1 className="text-[17px] font-semibold text-[#333333]">审批</h1>
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 flex items-center justify-center" aria-label="搜索">
                <Search size={20} color="#333333" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center" aria-label="新建">
                <FilePlus size={22} color="#333333" strokeWidth={2.2} />
              </button>
            </div>
          </header>

          {/* 筛选 Tab */}
          <nav className="px-5 pb-3 flex items-center gap-2">
            {FILTER_TABS.map((t) => {
              const isActive = filter === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`h-8 px-3 rounded-full text-[13px] transition font-medium flex items-center gap-1 ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#3A8EF5]'
                      : 'bg-[#F7FBFF] text-[#666666]'
                  }`}
                >
                  {t.key === 'all' && <span className="text-[14px]">☰</span>}
                  {t.key === 'recent' && <Calendar size={13} strokeWidth={2.4} />}
                  {t.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 审批列表 */}
        <div className="flex-1 px-4 pt-3 space-y-2.5">
          {filtered.map((a) => {
            const s = STATUS_STYLE[a.status]
            return (
              <article
                key={a.id}
                className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.99] transition"
              >
                <div className="flex gap-3">
                  {/* 图标 */}
                  <img src={a.icon} alt={a.type} className="w-[46px] h-[46px] object-contain shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-[#333333] truncate">
                            {a.type}
                          </span>
                          <span className="text-[12px] text-[#999999] shrink-0">{a.time}</span>
                        </div>
                        <div className="text-[12px] text-[#999999] mt-1 truncate">
                          {a.applicant}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[12px] px-2 py-0.5 rounded ${s.bg} ${s.fg} font-medium`}
                      >
                        {s.text}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[13px] text-[#333333]">{a.detail}</span>
                      {a.hasAttachment && (
                        <span className="flex items-center gap-1 text-[12px] text-[#999999]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M21 11.5l-8.5 8.5a6 6 0 01-8.5-8.5L12 3a4 4 0 015.66 5.66l-9.9 9.9a2 2 0 11-2.83-2.83L14.83 6.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          附件
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* 底部 Tab 栏 */}
        <BottomTabBar
          activeTab={activeTab}
          onTab={(key) => {
            setActiveTab(key)
            if (key === 'workbench') navigate('/')
            if (key === 'approval') navigate('/approvals')
            if (key === 'schedule' || key === 'contacts') {
              navigate('/')
            }
            if (key === 'profile') {
              navigate('/')
            }
          }}
        />
      </div>
    </div>
  )
}

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
