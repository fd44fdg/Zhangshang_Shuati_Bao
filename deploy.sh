#!/bin/bash

# 部署脚本 - 掌上刷题系统
# 使用方法: ./deploy.sh [环境] [选项]
# 环境: dev | test | prod
# 选项: --build-only | --deploy-only | --full

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
ENVIRONMENT=${1:-dev}
OPTION=${2:-full}

log_info "开始部署到 $ENVIRONMENT 环境，选项: $OPTION"

# 检查必要的工具
check_requirements() {
    log_info "检查部署环境..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker 未安装，将跳过容器化部署"
    fi
    
    log_success "环境检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 后端依赖
    log_info "安装后端依赖"
    cd backend
    npm install --production=false
    cd ..
    
    # 前端管理后台依赖
    log_info "安装管理后台依赖"
    cd admin-panel
    npm install
    cd ..
    
    # 移动端应用依赖
    log_info "安装移动端应用依赖"
    cd zhangshang-shuati-app
    npm install
    cd ..
    
    log_success "依赖安装完成"
}

# 构建项目
build_projects() {
    log_info "构建项目..."
    
    # 设置环境变量
    export NODE_ENV=$ENVIRONMENT
    
    # 构建管理后台
    log_info "构建管理后台"
    cd admin-panel
    npm run build
    cd ..
    
    # 构建移动端应用
    log_info "构建移动端应用"
    cd zhangshang-shuati-app
    npm run build:h5
    cd ..
    
    log_success "项目构建完成"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    # 后端测试
    log_info "运行后端测试"
    cd backend
    npm test
    cd ..
    
    # 前端测试
    log_info "运行前端测试"
    cd admin-panel
    npm run test:unit
    cd ..
    
    # 移动端测试
    log_info "运行移动端测试"
    cd zhangshang-shuati-app
    npm run test:unit
    cd ..
    
    log_success "测试完成"
}

# 数据库初始化
init_database() {
    log_info "初始化数据库..."
    
    cd backend
    
    # 根据环境选择配置文件
    if [ "$ENVIRONMENT" = "prod" ]; then
        cp .env.production .env
    fi
    
    # 初始化数据库
    node scripts/init-data.js
    
    # 如果是开发环境，添加测试数据
    if [ "$ENVIRONMENT" = "dev" ]; then
        node scripts/expand-data.js
    fi
    
    cd ..
    
    log_success "数据库初始化完成"
}

# Docker 部署
deploy_with_docker() {
    log_info "使用 Docker 部署..."
    
    # 构建 Docker 镜像
    log_info "构建 Docker 镜像"
    docker build -t zhangshang-shuati:$ENVIRONMENT .
    
    # 停止现有容器
    log_info "停止现有容器"
    docker-compose down || true
    
    # 启动新容器
    log_info "启动新容器"
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    
    log_success "Docker 部署完成"
}

# 传统部署
deploy_traditional() {
    log_info "传统方式部署..."
    
    # 复制构建文件到部署目录
    DEPLOY_DIR="/var/www/zhangshang-shuati"
    
    if [ ! -d "$DEPLOY_DIR" ]; then
        sudo mkdir -p $DEPLOY_DIR
    fi
    
    # 复制后端文件
    log_info "部署后端文件"
    sudo cp -r backend/* $DEPLOY_DIR/
    
    # 复制前端构建文件
    log_info "部署前端文件"
    sudo cp -r admin-panel/dist $DEPLOY_DIR/public/admin
    sudo cp -r zhangshang-shuati-app/dist $DEPLOY_DIR/public/app
    
    # 安装生产依赖
    cd $DEPLOY_DIR
    sudo npm install --production
    
    # 重启服务
    log_info "重启服务"
    sudo systemctl restart zhangshang-shuati || sudo pm2 restart zhangshang-shuati
    
    log_success "传统部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 10
    
    # 检查后端服务
    if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        log_success "后端服务健康检查通过"
    else
        log_error "后端服务健康检查失败"
        exit 1
    fi
    
    # 检查前端服务
    if curl -f http://localhost:8081 > /dev/null 2>&1; then
        log_success "前端服务健康检查通过"
    else
        log_warning "前端服务健康检查失败，可能需要手动检查"
    fi
    
    log_success "健康检查完成"
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    
    # 清理构建缓存
    rm -rf admin-panel/node_modules/.cache
    rm -rf zhangshang-shuati-app/node_modules/.cache
    
    # 清理日志文件
    find . -name "*.log" -type f -delete
    
    log_success "清理完成"
}

# 主函数
main() {
    case $OPTION in
        "--build-only")
            check_requirements
            install_dependencies
            build_projects
            ;;
        "--deploy-only")
            if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
                deploy_with_docker
            else
                deploy_traditional
            fi
            health_check
            ;;
        "--full"|*)
            check_requirements
            install_dependencies
            run_tests
            build_projects
            init_database
            
            if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
                deploy_with_docker
            else
                deploy_traditional
            fi
            
            health_check
            cleanup
            ;;
    esac
    
    log_success "部署完成！"
    log_info "访问地址:"
    log_info "  管理后台: http://localhost:8081"
    log_info "  移动端应用: http://localhost:8080"
    log_info "  API 文档: http://localhost:3000/api/v1/docs"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main