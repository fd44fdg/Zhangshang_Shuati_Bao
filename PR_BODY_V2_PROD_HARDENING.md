# V2: 生产就绪加固 — 统一 Cookie 会话、禁用生产 Mock/离线、补充 403/404、修复上传鉴权

## 概述
- 目标：上线前消除高风险“特殊情况”，统一认证方式，避免跨域/鉴权踩坑；不破坏现有用户空间。
- 范围：admin-panel-v2 前端与 backend 上传接口。

## 关键改动
### 前端（admin-panel-v2）
1) 统一认证为 Cookie 会话
   - 移除 UploadImage 的 Authorization Bearer 头，强制 withCredentials 走会话态。
   - 文件：`src/components/UploadImage.vue`
2) 生产禁用 Mock 与离线回退
   - `.env.production`：`VITE_OFFLINE_FALLBACK=false`，不设置 `VITE_DEV_AUTO_MOCK`。
   - 基址保持 `VITE_API_BASE=/api/v1`（生产靠 Nginx 同域反代）。
3) 异常页与守卫完善
   - 新增 403/404 页面：`src/views/system/Forbidden.vue`、`src/views/system/NotFound.vue`。
   - `src/routes.ts`：添加 `/403` 与 `/404`，未匹配路由跳转 `/404`。
   - `src/main.ts`：角色不足跳转 `/403`（原为回首页）。

### 后端（backend）
1) 上传接口切换到 Cookie 会话验证
   - `routes/upload.js`：从 `verifyToken + isAdmin`（Bearer）改为 `authV2.verifyAccess + requireRoles('admin')`（Cookie）。
   - 与 `/auth/login-v2` 所发的 Cookie 完全一致，避免鉴权风格不一致导致 401。

## 部署要点（生产必须）
- 同域反代，不要跨域：Nginx 将 `/api/v1` 反代到后端（如 `http://127.0.0.1:3001`）。
- SPA fallback：`try_files $uri /index.html`，避免 F5 刷新 404。
- HTTPS + Cookie：生产下 `Secure=true`；`SameSite=strict`（同域 OK）。如涉及多域场景需调整为 `Lax/None`。
- 前端不写死真实 API 域名，保持 `VITE_API_BASE=/api/v1`。

## 验证清单
- 登录：`POST /api/v1/auth/login-v2` -> `GET /api/v1/auth/me` -> 进入仪表盘。
- 权限：访问无权页面跳 `/403`；未知路由跳 `/404`。
- 上传：`POST /api/v1/upload/banners` 返回 201，响应含 `data.url`，请求携带 Cookie。
- 刷新：任意子路由 F5 正常（验证 SPA fallback）。

## 兼容性与回滚
- 无破坏性协议变更；仅前端上传从 Bearer 统一到 Cookie。
- 如需紧急回滚上传鉴权，可将 `routes/upload.js` 恢复为 `verifyToken + isAdmin`（不建议）。

## 涉及文件
- admin-panel-v2:
  - `src/components/UploadImage.vue`
  - `.env.production`
  - `src/routes.ts`
  - `src/views/system/Forbidden.vue`
  - `src/views/system/NotFound.vue`
  - `src/main.ts`
- backend:
  - `routes/upload.js`

## 提交信息建议
```
feat(v2): production hardening — unify cookie auth, disable prod mock/offline, add 403/404, fix upload auth
```
