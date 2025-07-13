# 掌上刷题项目部署指南

## 已修复的问题 ✅

### 1. 数据库配置统一
- **问题**: 开发环境、Docker配置、生产环境的数据库配置不一致
- **修复**: 统一使用以下配置
  ```
  数据库名: zhangshang_shuati
  用户名: root
  密码: 1145
  端口: 3306
  ```

### 2. API地址配置优化
- **问题**: 前端API地址硬编码为localhost
- **修复**: 使用环境变量配置，支持开发/生产环境切换
  - 开发环境: `http://localhost:3000/api/v1`
  - 生产环境: `https://your-domain.com/api/v1`

### 3. 环境配置文件
- **新增**: 为前端项目添加了 `.env` 和 `.env.production` 配置文件
- **支持**: 环境变量自动切换

## 快速启动 🚀

### 方法一：使用快速启动脚本
```bash
# Windows用户
.\quick-start.bat
```

### 方法二：手动启动

#### 1. 启动后端服务
```bash
# 启动数据库和后端
docker-compose up -d mysql redis backend

# 等待数据库启动后，初始化数据
cd backend
node scripts/init-data.js
```

#### 2. 启动管理后台
```bash
cd admin-panel
npm install
npm run serve
# 访问: http://localhost:8080
```

#### 3. 启动移动端应用
```bash
cd zhangshang-shuati-app
npm install
npm run dev:h5
# 访问: http://localhost:8081
```

## 生产环境部署 🌐

### 1. 配置域名
修改以下文件中的域名配置：
- `admin-panel/.env.production`
- `zhangshang-shuati-app/.env.production`
- `nginx.prod.conf`

### 2. 启动生产环境
```bash
# 使用生产环境配置
docker-compose -f docker-compose.prod.yml up -d
```

### 3. SSL证书配置（可选）
如需HTTPS，请：
1. 申请SSL证书
2. 将证书文件放入 `ssl/` 目录
3. 取消注释 `nginx.conf` 中的HTTPS配置

## 访问地址 📱

- **管理后台**: http://localhost:8080
- **移动端H5**: http://localhost:8081  
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/api/v1

## 小程序发布 📲

### 微信小程序
```bash
cd zhangshang-shuati-app
npm run build:mp-weixin
```
然后使用微信开发者工具打开 `dist/build/mp-weixin` 目录

### 其他平台
- 支付宝小程序: `npm run build:mp-alipay`
- 百度小程序: `npm run build:mp-baidu`
- 字节跳动小程序: `npm run build:mp-toutiao`

## 常见问题 ❓

### 1. 数据库连接失败
- 确保Docker中的MySQL容器正常运行
- 检查端口3306是否被占用

### 2. 前端无法访问API
- 检查后端服务是否启动 (端口3000)
- 确认API地址配置正确

### 3. 跨域问题
- 后端已配置CORS，支持localhost:8080和localhost:8081
- 生产环境需要配置正确的域名

## 项目结构 📁

```
xmwj_02/
├── backend/              # Node.js后端
├── admin-panel/          # Vue3管理后台
├── zhangshang-shuati-app/# uni-app移动端
├── docker-compose.yml    # 开发环境Docker配置
├── docker-compose.prod.yml # 生产环境Docker配置
├── nginx.conf           # Nginx配置
└── quick-start.bat      # 快速启动脚本
```

## 技术栈 🛠️

- **后端**: Node.js + Express + MySQL + Redis
- **管理后台**: Vue3 + Element Plus + Axios
- **移动端**: uni-app (支持小程序/H5/APP)
- **部署**: Docker + Nginx
- **数据库**: MySQL 8.0
- **缓存**: Redis 7

---

现在项目已经可以正常部署和运行了！🎉