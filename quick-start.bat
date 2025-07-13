@echo off
echo ========================================
echo 掌上刷题项目快速启动脚本
echo ========================================
echo.

echo 1. 启动数据库和后端服务...
docker-compose up -d mysql redis backend
echo.

echo 2. 等待数据库启动...
timeout /t 10 /nobreak
echo.

echo 3. 初始化数据库...
cd backend
node scripts/init-data.js
cd ..
echo.

echo 4. 启动管理后台 (新窗口)...
start cmd /k "cd admin-panel && npm install && npm run serve"
echo.

echo 5. 启动移动端应用 (新窗口)...
start cmd /k "cd zhangshang-shuati-app && npm install && npm run dev:h5"
echo.

echo ========================================
echo 启动完成！
echo 管理后台: http://localhost:8080
echo 移动端H5: http://localhost:8081
echo 后端API: http://localhost:3000
echo ========================================
pause