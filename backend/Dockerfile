FROM node:18-alpine

# 创建工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p logs public/uploads

# 设置权限
RUN chmod -R 755 public

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"] 