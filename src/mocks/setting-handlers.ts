// MSW handlers — 设置模块
// 对照 API_REFERENCE.md §设置
import { http, HttpResponse } from 'msw'

let pswdStatus = { expired: false, days_remaining: 45 }

export const settingHandlers = [
  // PUT /v3/users/{user_id} — 修改密码
  http.put('/v3/users/:user_id', async ({ request }) => {
    const body = (await request.json()) as { user: { password?: string } }
    if (!body.user?.password) {
      return HttpResponse.json({ error: { message: '密码不能为空', code: 400 } }, { status: 400 })
    }
    return HttpResponse.json({
      user: { id: 'user-admin', name: 'admin', enabled: true },
    })
  }),

  // GET /v1/system/query_pswd_status/{user_id} — 密码状态查询
  http.get('/v1/system/query_pswd_status/:user_id', () => HttpResponse.json(pswdStatus)),

  // GET /v1/system/session_timeout — 会话超时 (已在 system-handlers 中)
  // PUT /v1/system/session_timeout — 会话超时 (已在 system-handlers 中)

  // GET /v1/system/pswd_change_cycle — 密码更换周期 (已在 system-handlers 中)
  // PUT /v1/system/pswd_change_cycle — 密码更换周期 (已在 system-handlers 中)
]
