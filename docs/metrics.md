# 监控与度量使用说明（v1）

目标：在不破坏业务的前提下，暴露可观测性指标，帮助定位慢接口、异常尖峰与数据库瓶颈。

端点
- 健康检查：/health（JSON）
- 指标：/metrics
  - JSON：默认输出
  - Prometheus 文本：Accept: text/plain 或 ?format=prom

指标模型（首版）
- HTTP
  - application.http.total：请求总数
  - application.http.errors：错误请求总数（HTTP 状态码 ≥ 400）
  - application.http.avg：平均响应时间（毫秒）
  - application.http.routes（按“方法 + 路由键”聚合）：{ total, errors, avg, p95 }
- DB
  - application.db.total：查询总数
  - application.db.avg：平均查询耗时（毫秒）
  - application.db.p95：查询耗时 95 分位（毫秒）
- 系统信息
  - 内存/堆、CPU 核心、loadAverage 等摘要信息（辅助判断）

JSON 示例（节选）
```
{
  "timestamp": "2025-09-03T10:23:45.123Z",
  "application": {
    "uptime": 12345,
    "requests_total": 456,
    "errors_total": 7,
    "avg_response_time": 42,
    "http": {
      "total": 456,
      "errors": 7,
      "avg": 42,
      "routes": {
        "GET /api/v1/auth/verify": { "total": 120, "errors": 1, "avg": 35, "p95": 88 }
      }
    },
    "db": { "total": 980, "avg": 8, "p95": 22 }
  }
}
```

Prometheus 文本示例（节选）
```
# HELP app_http_requests_total Total HTTP requests
# TYPE app_http_requests_total counter
app_http_requests_total 12
# HELP app_http_request_route_duration_ms_avg Average duration per route
# TYPE app_http_request_route_duration_ms_avg gauge
app_http_request_route_duration_ms_avg{method="GET",route="/api/v1/auth/verify"} 35
```

仪表盘建议
- HTTP：total/errors/errorRate；avg/p95；Top N 慢路由
- DB：total/avg/p95；峰值时段；与 HTTP p95 对齐排查慢 SQL

告警建议（按业务调整）
- errorRate > 5%（5 分钟）
- 任一路由 p95 > 500ms（5 分钟）连续 3 个周期
- DB p95 > 100ms（5 分钟）连续 3 个周期
- 5xx rate > 1%（5 分钟）

访问控制（生产）
- /metrics 建议仅内网或受保护访问（WAF/白名单/鉴权）

常见问题
- DB 指标为 0：当前为 stub DB（test:api），或未触发查询
- 路由键不准：路由未命中定义时回退到 req.path，建议通过标准路由访问

变更记录
- v1：JSON 输出；HTTP+DB 指标；/metrics 支持 Prom 文本格式
