import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiUrl } from './api'

// localStorage key
export const TOKEN_KEY = 'oa_token'
export const USER_KEY = 'oa_user'

export function getAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

export function setAuth({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// —— 飞鸟 Logo（参考设计稿左上角蓝色圆角方块）——
function BirdLogo() {
  return (
    <div className="w-12 h-12 rounded-xl bg-[#4A9DF6] flex items-center justify-center shadow-md">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 13c2-3 5-5 9-5 3 0 5 1.5 7 4-1.5-.5-3-1-4.5-1-2 0-3.5.8-5 2-1.5-1-3-1.5-4.5-1.5C4 11.5 3.5 12 3 13z"
          fill="#fff"
        />
        <path
          d="M8 15c1.5-1 3-1.5 5-1.5 1.5 0 3 .5 4.5 1.5-1 .3-2 .5-3 .5-2 0-3.5-.5-4.5-1.5z"
          fill="#fff"
          opacity=".85"
        />
      </svg>
    </div>
  )
}

// —— 底部 Tab 指示条（在 Tab 之间丝滑切换）——
function TabIndicator({ active, tabCount }) {
  const pct = (100 / tabCount) * active
  return (
    <span
      className="absolute bottom-0 h-[3px] w-6 rounded-full bg-[#3A8EF5] transition-all duration-300 ease-out"
      style={{ left: `calc(${pct}% + ${active === 0 ? 12 : 28}px)` }}
    />
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirect = location.state?.from || '/'

  const [mode, setMode] = useState('account') // 'account' | 'email'
  const [account, setAccount] = useState('admin')
  const [email, setEmail] = useState('admin@test.com')
  const [password, setPassword] = useState('123456')
  const [agree, setAgree] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')
    if (!agree) { setError('请先阅读并同意《隐私协议》'); return }
    if (!password) { setError('请输入登录密码'); return }
    const body = mode === 'account'
      ? { username: account, password }
      : { email, password }
    const missing = mode === 'account' ? !account : !email
    if (missing) { setError(mode === 'account' ? '请输入账号' : '请输入邮箱'); return }

    setLoading(true)
    try {
      const r = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || '登录失败，请稍后再试')
        return
      }
      setAuth({ token: data.token, user: data.user })
      navigate(redirect, { replace: true })
    } catch (err) {
      setError('网络异常，请检查网络后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex justify-center bg-gradient-to-b from-[#EAF4FE] via-[#F4F9FE] to-white">
      <div className="w-full max-w-[450px] min-h-screen relative flex flex-col px-6 pt-14">
        {/* 顶部 Logo + 欢迎语 */}
        <div className="mb-8">
          <BirdLogo />
          <h1 className="mt-5 text-[24px] font-semibold text-[#1A1A1A]">你好！</h1>
          <p className="mt-1 text-[13px] text-[#8A8F99]">欢迎使用翔明系统~</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-6 mb-7 relative">
          {[
            { key: 'account', label: '账号登录' },
            { key: 'email', label: '邮箱登录' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setMode(t.key); setError('') }}
              className={`text-[17px] font-medium transition-colors duration-200 ${
                mode === t.key ? 'text-[#1A1A1A] font-semibold' : 'text-[#8A8F99]'
              }`}
            >
              {t.label}
            </button>
          ))}
          {/* 下划线 */}
          <div className="absolute -bottom-1 left-0 w-full h-[3px]">
            <TabIndicator active={mode === 'account' ? 0 : 1} tabCount={2} />
          </div>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {mode === 'account' ? (
            <div>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入手机号/用户名"
                autoComplete="username"
                className="w-full h-12 px-0 border-b border-[#E5E8EF] bg-transparent text-[15px] text-[#1A1A1A] placeholder:text-[#B8BEC8] focus:outline-none focus:border-[#3A8EF5] transition-colors"
              />
            </div>
          ) : (
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                autoComplete="email"
                className="w-full h-12 px-0 border-b border-[#E5E8EF] bg-transparent text-[15px] text-[#1A1A1A] placeholder:text-[#B8BEC8] focus:outline-none focus:border-[#3A8EF5] transition-colors"
              />
            </div>
          )}

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入登录密码"
              autoComplete="current-password"
              className="w-full h-12 px-0 border-b border-[#E5E8EF] bg-transparent text-[15px] text-[#1A1A1A] placeholder:text-[#B8BEC8] focus:outline-none focus:border-[#3A8EF5] transition-colors"
            />
          </div>

          {/* 忘记密码 */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-[13px] text-[#3A8EF5] hover:opacity-80 transition"
              onClick={() => setError('忘记密码功能暂未开放')}
            >
              忘记密码？
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-[13px] text-[#F54444] -mt-2">{error}</div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 rounded-xl text-[15px] font-medium text-white bg-gradient-to-r from-[#6AA8FA] to-[#4A9DF6] shadow-[0_6px_16px_rgba(58,142,245,0.28)] active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? '登录中…' : '立即登录'}
          </button>
        </form>

        {/* 底部切换入口 */}
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => { setMode(mode === 'account' ? 'email' : 'account'); setError('') }}
            className="text-[13px] text-[#3A8EF5] hover:opacity-80 transition"
          >
            {mode === 'account' ? '邮箱登录' : '账号登录'}
          </button>
        </div>

        {/* 底部隐私协议（固定在底部） */}
        <div className="mt-auto pt-10 pb-8 flex justify-center items-center gap-2">
          <button
            type="button"
            onClick={() => setAgree((v) => !v)}
            className="w-4 h-4 rounded flex items-center justify-center border transition"
            style={{
              background: agree ? '#3A8EF5' : '#fff',
              borderColor: agree ? '#3A8EF5' : '#D7DBE3',
            }}
            aria-label="同意隐私协议"
          >
            {agree && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <span className="text-[12px] text-[#8A8F99]">
            我已阅读并同意
            <span className="text-[#3A8EF5]">《隐私协议》</span>
          </span>
        </div>
      </div>
    </div>
  )
}
