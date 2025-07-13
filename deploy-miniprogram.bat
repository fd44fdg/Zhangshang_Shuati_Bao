@echo off
chcp 65001
echo ========================================
echo 掌上刷题小程序自动部署脚本
echo ========================================
echo.

:: 检查Node.js是否安装
echo [1/6] 检查Node.js环境...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js环境检查通过
echo.

:: 进入小程序项目目录
echo [2/6] 进入项目目录...
cd /d "E:\xmwj_02\zhangshang-shuati-app"
if %errorlevel% neq 0 (
    echo ❌ 错误: 无法进入项目目录
    pause
    exit /b 1
)
echo ✅ 已进入项目目录: %cd%
echo.

:: 安装依赖
echo [3/6] 安装项目依赖...
echo 这可能需要几分钟时间，请耐心等待...
npm install
if %errorlevel% neq 0 (
    echo ❌ 错误: 依赖安装失败
    echo 尝试清除缓存后重新安装...
    npm cache clean --force
    rmdir /s /q node_modules 2>nul
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装仍然失败，请检查网络连接
        pause
        exit /b 1
    )
)
echo ✅ 依赖安装完成
echo.

:: 构建小程序
echo [4/6] 构建微信小程序...
npm run build:mp-weixin
if %errorlevel% neq 0 (
    echo ❌ 错误: 小程序构建失败
    pause
    exit /b 1
)
echo ✅ 小程序构建完成
echo.

:: 检查构建结果
echo [5/6] 检查构建结果...
set "BUILD_DIR=dist\build\mp-weixin"
if not exist "%BUILD_DIR%\app.js" (
    echo ❌ 错误: 构建文件不完整，缺少app.js
    pause
    exit /b 1
)
if not exist "%BUILD_DIR%\app.json" (
    echo ❌ 错误: 构建文件不完整，缺少app.json
    pause
    exit /b 1
)
echo ✅ 构建文件检查通过
echo.

:: 复制配置文件
echo [6/6] 复制配置文件...
copy "src\project.config.json" "%BUILD_DIR%\project.config.json" >nul 2>&1
copy "src\sitemap.json" "%BUILD_DIR%\sitemap.json" >nul 2>&1
echo ✅ 配置文件复制完成
echo.

echo ========================================
echo 🎉 小程序构建完成！
echo ========================================
echo.
echo 📁 构建文件位置: %cd%\%BUILD_DIR%
echo.
echo ⚠️  构建警告说明:
echo - Sass 弃用警告: 不影响功能，建议后续升级时处理
echo - 导出函数警告: 可能影响学习记录功能，建议检查 API 文件
echo - 这些警告不会影响小程序的正常运行
echo.
echo 📋 接下来的步骤:
echo 1. 打开微信开发者工具
echo 2. 选择"导入项目"
echo 3. 项目目录选择: %cd%\%BUILD_DIR%
echo 4. 填入你的小程序AppID
echo 5. 点击"导入"
echo.
echo 💡 提示:
echo - 如果是第一次导入，请确保已在微信公众平台注册小程序
echo - 记得在微信公众平台配置服务器域名
echo - 域名必须是HTTPS协议
echo - 如需解决构建警告，请参考 "代码质量改进建议.md"
echo.
echo 📖 详细部署指南请查看: 微信小程序部署完整指南.md
echo.

:: 询问是否打开构建目录
set /p "OPEN_DIR=是否打开构建目录? (y/n): "
if /i "%OPEN_DIR%"=="y" (
    explorer "%BUILD_DIR%"
)

:: 询问是否打开微信开发者工具
set /p "OPEN_DEVTOOLS=是否打开微信开发者工具下载页面? (y/n): "
if /i "%OPEN_DEVTOOLS%"=="y" (
    start https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
)

echo.
echo 部署脚本执行完成！
pause