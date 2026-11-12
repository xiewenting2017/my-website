import cors from 'cors'
import express from 'express'
import OpenAI from 'openai'

import { getSettings, listMessages, updateMessageFlags, upsertSettings } from './db.js'

if (process.env.NODE_ENV !== 'production') {
  try {
    process.loadEnvFile();
  } catch (e) {
    console.log('本地 .env 文件未找到，将使用系统环境变量');
  }
}

const app = express()
const port = Number(process.env.PORT) || 3001

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

// 允许跨域：生产环境前端部署在 Vercel 等独立域名下
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'oa-ai-app',
    message: 'Express server is running',
  })
})

// ---- 消息表 ----
app.get('/api/messages', (_req, res) => {
  res.json({ messages: listMessages() })
})

app.patch('/api/messages/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid message id' })
    return
  }
  const { is_read, is_pinned } = req.body ?? {}
  if (is_read === undefined && is_pinned === undefined) {
    res.status(400).json({ error: 'nothing to update' })
    return
  }
  const row = updateMessageFlags(id, {
    is_read: is_read === undefined ? undefined : !!is_read,
    is_pinned: is_pinned === undefined ? undefined : !!is_pinned,
  })
  if (!row) {
    res.status(404).json({ error: 'message not found' })
    return
  }
  res.json({ message: row })
})

// ---- 偏好设置表 ----
const parseSettings = (row) =>
  row && { ...row, prefs: row.prefs ? JSON.parse(row.prefs) : null }

app.get('/api/settings/:role', (req, res) => {
  const row = getSettings(req.params.role)
  if (!row) {
    // 未配置过的角色返回默认值，不落库
    res.json({
      settings: {
        user_role: req.params.role,
        app_push_enabled: 1,
        dnd_enabled: 0,
        dnd_start: '22:00',
        dnd_end: '08:00',
        prefs: null,
      },
      isDefault: true,
    })
    return
  }
  res.json({ settings: parseSettings(row) })
})

const handleUpsertSettings = (req, res) => {
  const role = req.params.role
  const body = req.body ?? {}
  const current = getSettings(role) ?? {
    app_push_enabled: 1,
    dnd_enabled: 0,
    dnd_start: '22:00',
    dnd_end: '08:00',
    prefs: null,
  }
  const currentPrefs = current.prefs ? JSON.parse(current.prefs) : null
  const merged = {
    app_push_enabled:
      body.app_push_enabled === undefined ? !!current.app_push_enabled : !!body.app_push_enabled,
    dnd_enabled: body.dnd_enabled === undefined ? !!current.dnd_enabled : !!body.dnd_enabled,
    dnd_start: typeof body.dnd_start === 'string' ? body.dnd_start : current.dnd_start,
    dnd_end: typeof body.dnd_end === 'string' ? body.dnd_end : current.dnd_end,
    prefs: body.prefs && typeof body.prefs === 'object' ? body.prefs : currentPrefs,
  }
  res.json({ settings: parseSettings(upsertSettings(role, merged)) })
}

app.put('/api/settings/:role', handleUpsertSettings)
app.post('/api/settings/:role', handleUpsertSettings)

app.post('/api/summary', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''

  if (!process.env.DEEPSEEK_API_KEY) {
    res.status(500).json({ error: 'DEEPSEEK_API_KEY is not set' })
    return
  }

  if (!text) {
    res.status(400).json({ error: 'text is required' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const abort = new AbortController()
  res.on('close', () => {
    if (!res.writableEnded) abort.abort()
  })

  const send = (payload) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }
  }

  try {
    const stream = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: [
            '你是一名高管助理，需要当面向领导口头汇报消息摘要。要求：',
            '1. 只输出一段话，不要列表、不要分点、不要 Markdown 标记、不要任何解释，全文严格控制在 45 字以内（含标点）。',
            '2. 必须突出金额最大的待审批事项（写明金额），以及最紧急的预警，其余消息一句话一笔带过。',
            '3. 将需要重点关注的 1~3 个短语用 <hl> 和 </hl> 标签包裹（标签必须成对闭合），例如：您有2条未读：<hl>1条公告通知</hl> <hl>1条合同到期预警</hl>，建议优先处理。',
            '4. 除 <hl></hl> 标签外，不要输出任何其他符号或标记。',
          ].join('\n'),
        },
        { role: 'user', content: text },
      ],
      stream: true,
      signal: abort.signal,
    })

    for await (const chunk of stream) {
      if (abort.signal.aborted) break
      const content = chunk.choices[0]?.delta?.content
      if (content) send({ content })
    }

    if (!res.writableEnded) {
      res.write('data: [DONE]\n\n')
      res.end()
    }
  } catch (error) {
    if (abort.signal.aborted || res.writableEnded) return
    const message = error instanceof Error ? error.message : 'DeepSeek request failed'
    send({ error: message })
    res.end()
  }
})

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})
