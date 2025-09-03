概述

 • 目标：统一协议、消除特殊情况、降低复杂度，在不破坏用户空间前提下提升稳定性。
 • 范围：后端（认证、返回结构、上传、路由、测试）、管理后台（统一客户端）、小程序（响应标准化）、工作区依赖与脚本。

核心改动

 • 后端
    • JWT 严格校验：middleware/auth.js、routes/auth.js
       • jwt.verify 增加 algorithms/issuer/audience 校验；兼容旧令牌（仅在 iss/aud 报错时降级一次）。
    • 响应结构统一：routes 全部 sendSuccess/sendError；移除 code=20000 遗留（user.js）。
    • 上传统一：middleware/upload.js（新增）；user 头像上传改为 avatars 子目录，复用全局大小/类型限制。
    • 路由规范与别名：
       • 新增 /api/v1/auth/login|register；旧 /api/v1/login|register 保留并返回 Deprecation + successor Link（开发环境）。
    • server.js
       • 仅注册 centralized globalErrorHandler。
       • 测试环境跳过 checkin 路由 + rate limit，避免 sqlite3 原生绑定问题。
    • seeds（MySQL 兼容）：backend/database/seeds/001_initial_data.js 去除 returning('id')。
    • 测试：新增 backend/tests/api-smoke.test.js（最小合同测试：旧/新登录路径、404、未授权上传）
       • jest.api.config.js 配置；package.json 增加 test:api 脚本。
    • 脚本跨平台：cross-env 已接入。
 • 管理后台（admin-panel）
    • 接入 @shared/api：src/utils/request.js 使用统一客户端 createClient。
    • 修复 API 路径：/auth/、/users/、/admin/users RESTful 对齐后端；清除 '/api/' 前缀重复问题。
    • package.json 增加依赖 "@shared/api": "workspace:*"；pnpm workspace 识别 shared/api。
 • 小程序
    • 响应标准化：src/utils/request.js 统一映射为 { success, code, data, message }；统一 401/403 行为，不改底层适配。
 • 工作区
    • 新增 shared/api 包（@shared/api）：adapter.js（createClient、setBaseURL、setTokenGetter、setUnauthorizedHandler）、index.js 导出。
    • pnpm-workspace.yaml 增加 shared/api。

验证方式

 • 后端：
    • npm run db:init:seed（无 returning 警告）
    • npm run test:api（通过）
    • curl 验证：
       • POST /api/v1/login -> 400 + Deprecation/Link
       • POST /api/v1/auth/login -> 400
       • GET /nonexistent -> 404 + JSON
       • POST /api/v1/questions/upload -> 401（未带 token）
 • 管理后台：
    • 根目录 pnpm install；admin-panel 启动后验证 登录/用户管理/上传
 • 小程序：
    • 构建后验证过期登录与业务错误提示是否一致

兼容性与回滚

 • 旧登录路径继续可用（带弃用提示）
 • JWT 保留 userId 镜像
 • 仅在测试环境禁用 checkin 路由与 rate limit，不影响开发/生产。

后续计划（非此 PR 必须项）

 • 扩展 supertest：正向链路（register -> login -> verify）、/admin/users 权限、上传 400/401 用例。
 • 监控指标增强（请求/DB 耗时）。
 • legacy 脚本迁移 Knex 或标记 deprecated。
 • 旧路由退场时间表（Confluence）。

变更文件（主要）

 • 后端
    • middleware/auth.js, routes/auth.js, routes/user.js, middleware/upload.js(+), config/index.js, config/database-adapter.js, server.js, database/seeds/001_initial_data.js, tests/api-smoke.test.js(+), jest.api.config.js(+), package.json
 • 前端
    • admin-panel/src/utils/request.js, admin-panel/src/api/user.js, security.js, admin.js
    • zhangshang-shuati-app/src/utils/request.js
 • 工作区
    • shared/api/package.json(+), shared/api/adapter.js(+), shared/api/index.js(+), pnpm-workspace.yaml

验证与回滚说明：见上文。
