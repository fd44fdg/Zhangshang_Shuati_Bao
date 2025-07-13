# 多阶段构建 Dockerfile
# 第一阶段：构建前端应用
FROM node:16-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app

# 复制前端项目文件
COPY admin-panel/package*.json ./admin-panel/
COPY zhangshang-shuati-app/package*.json ./zhangshang-shuati-app/

# 安装依赖
RUN cd admin-panel && npm ci --only=production
RUN cd zhangshang-shuati-app && npm ci --only=production

# 复制源代码
COPY admin-panel/ ./admin-panel/
COPY zhangshang-shuati-app/ ./zhangshang-shuati-app/

# 构建前端应用
RUN cd admin-panel && npm run build
RUN cd zhangshang-shuati-app && npm run build:h5

# 第二阶段：构建后端应用
FROM node:16-alpine AS backend-builder

WORKDIR /app

# 复制后端项目文件
COPY backend/package*.json ./
RUN npm ci --only=production

# 复制后端源代码
COPY backend/ ./

# 第三阶段：生产环境
FROM node:16-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache \
    mysql-client \
    curl \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制后端应用
COPY --from=backend-builder --chown=nodejs:nodejs /app ./

# 复制前端构建产物
COPY --from=frontend-builder --chown=nodejs:nodejs /app/admin-panel/dist ./public/admin
COPY --from=frontend-builder --chown=nodejs:nodejs /app/zhangshang-shuati-app/dist/build/h5 ./public/mobile

# 创建日志目录
RUN mkdir -p logs && chown nodejs:nodejs logs

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/health || exit 1

# 启动应用
CMD ["node", "server.js"]