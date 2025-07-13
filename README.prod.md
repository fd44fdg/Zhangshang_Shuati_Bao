# 掌上刷题系统 - 生产环境部署指南

## 系统概述

掌上刷题系统是一个基于Vue.js + Node.js的在线学习平台，包含移动端应用和管理后台。

### 技术栈
- **前端**: Vue.js 2.x, Vant UI, uni-app
- **后端**: Node.js, Express.js
- **数据库**: MySQL 8.0, Redis 6.x
- **部署**: Docker, Nginx, Docker Compose
- **监控**: Prometheus, Grafana

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户/管理员    │────│      Nginx      │────│   Load Balancer │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用       │    │   后端API服务    │    │   文件存储       │
│ (Vue.js/uni-app)│    │   (Node.js)     │    │   (本地/OSS)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     MySQL       │    │      Redis      │    │   监控系统       │
│   (主数据库)     │    │    (缓存)       │    │ (Prometheus)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 部署前准备

### 1. 服务器要求

**最低配置**:
- CPU: 2核
- 内存: 4GB
- 存储: 50GB SSD
- 网络: 5Mbps

**推荐配置**:
- CPU: 4核
- 内存: 8GB
- 存储: 100GB SSD
- 网络: 10Mbps

### 2. 软件依赖

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 3. 域名和SSL证书

```bash
# 安装 Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 申请SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 快速部署

### 1. 克隆项目

```bash
git clone https://github.com/your-username/shuati-system.git
cd shuati-system
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.production .env

# 编辑配置文件
vim .env
```

**重要配置项**:
- `DB_PASSWORD`: 数据库密码
- `REDIS_PASSWORD`: Redis密码
- `JWT_SECRET`: JWT密钥
- `CORS_ORIGIN`: 允许的域名

### 3. 启动服务

```bash
# 使用部署脚本
chmod +x deploy.sh
./deploy.sh prod

# 或手动启动
docker-compose -f docker-compose.prod.yml up -d
```

### 4. 初始化数据库

```bash
# 等待数据库启动
sleep 30

# 执行数据库迁移
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# 导入初始数据
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

## 配置详解

### Nginx 配置

主要配置文件: `nginx.prod.conf`

**关键配置**:
- SSL/TLS 配置
- 反向代理设置
- 静态文件缓存
- 安全头设置
- 限流配置

### Docker Compose 配置

主要配置文件: `docker-compose.prod.yml`

**服务说明**:
- `mysql`: 主数据库
- `redis`: 缓存服务
- `backend`: 后端API服务
- `nginx`: 反向代理和静态文件服务
- `prometheus`: 监控数据收集
- `grafana`: 监控数据可视化

## 监控和日志

### 1. 应用监控

**Prometheus 指标**:
- HTTP 请求数量和延迟
- 数据库连接池状态
- Redis 连接状态
- 系统资源使用情况

**访问地址**:
- Prometheus: `https://your-domain.com:9090`
- Grafana: `https://your-domain.com:3001`

### 2. 日志管理

**日志位置**:
```bash
# 应用日志
docker-compose logs -f backend

# Nginx 日志
docker-compose logs -f nginx

# 数据库日志
docker-compose logs -f mysql
```

**日志轮转**:
```bash
# 配置 logrotate
sudo vim /etc/logrotate.d/docker-containers
```

## 备份和恢复

### 1. 数据库备份

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/mysql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose -f docker-compose.prod.yml exec mysql mysqldump \
  -u root -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  shuati_prod > $BACKUP_DIR/shuati_prod_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/shuati_prod_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: shuati_prod_$DATE.sql.gz"
```

### 2. 文件备份

```bash
#!/bin/bash
# backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/files"

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ./uploads/

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env nginx.prod.conf docker-compose.prod.yml

echo "文件备份完成"
```

### 3. 自动备份

```bash
# 添加到 crontab
crontab -e

# 每天凌晨2点备份数据库
0 2 * * * /path/to/backup.sh

# 每周日凌晨3点备份文件
0 3 * * 0 /path/to/backup-files.sh
```

## 性能优化

### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_user_id ON questions(user_id);
CREATE INDEX idx_category_id ON questions(category_id);
CREATE INDEX idx_created_at ON user_answers(created_at);

-- 优化查询
ANALYZE TABLE questions;
ANALYZE TABLE users;
ANALYZE TABLE user_answers;
```

### 2. Redis 缓存策略

```javascript
// 缓存热点数据
const cacheKeys = {
  userStats: (userId) => `user:stats:${userId}`,
  questionList: (page, category) => `questions:${page}:${category}`,
  categoryList: 'categories:all'
};

// 设置合理的过期时间
const cacheTTL = {
  userStats: 300,      // 5分钟
  questionList: 600,   // 10分钟
  categoryList: 3600   // 1小时
};
```

### 3. CDN 配置

```nginx
# 静态资源 CDN 配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}
```

## 安全配置

### 1. 防火墙设置

```bash
# 安装 ufw
sudo apt-get install ufw

# 基础规则
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

### 2. 安全头配置

已在 `nginx.prod.conf` 中配置:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Referrer-Policy

### 3. 限流配置

```nginx
# API 限流
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# 登录限流
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=1r/s;
```

## 故障排除

### 1. 常见问题

**服务无法启动**:
```bash
# 检查日志
docker-compose -f docker-compose.prod.yml logs

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 检查磁盘空间
df -h
```

**数据库连接失败**:
```bash
# 检查数据库状态
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p -e "SHOW PROCESSLIST;"

# 检查网络连接
docker-compose -f docker-compose.prod.yml exec backend ping mysql
```

**Redis 连接失败**:
```bash
# 检查 Redis 状态
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# 检查 Redis 配置
docker-compose -f docker-compose.prod.yml exec redis redis-cli config get "*"
```

### 2. 性能问题

**高 CPU 使用率**:
```bash
# 查看进程状态
docker stats

# 分析慢查询
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p -e "SHOW FULL PROCESSLIST;"
```

**内存不足**:
```bash
# 检查内存使用
free -h

# 检查 Docker 容器内存使用
docker stats --no-stream
```

## 更新和维护

### 1. 应用更新

```bash
#!/bin/bash
# update.sh

echo "开始更新应用..."

# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose -f docker-compose.prod.yml build --no-cache

# 滚动更新
docker-compose -f docker-compose.prod.yml up -d

# 清理旧镜像
docker image prune -f

echo "应用更新完成"
```

### 2. 数据库维护

```bash
# 优化表
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p -e "OPTIMIZE TABLE questions, users, user_answers;"

# 检查表状态
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p -e "CHECK TABLE questions, users, user_answers;"
```

### 3. 清理任务

```bash
#!/bin/bash
# cleanup.sh

# 清理 Docker 资源
docker system prune -f

# 清理日志文件
find /var/log -name "*.log" -mtime +30 -delete

# 清理临时文件
find /tmp -mtime +7 -delete

echo "清理完成"
```

## 联系信息

- **技术支持**: tech-support@your-domain.com
- **运维团队**: ops@your-domain.com
- **紧急联系**: +86-xxx-xxxx-xxxx

## 版本历史

- **v1.0.0** (2024-01-01): 初始版本
- **v1.0.1** (2024-01-15): 性能优化和安全加固
- **v1.1.0** (2024-02-01): 新增监控和日志功能

---

**注意**: 请根据实际情况修改配置文件中的域名、密码等敏感信息。