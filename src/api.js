// API 基础路径：生产环境通过 VITE_API_URL 指向后端域名；开发环境留空，走 Vite 代理
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export const apiUrl = (path) => `${API_BASE}${path}`
