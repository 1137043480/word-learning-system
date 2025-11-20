#!/bin/bash

echo "🚀 启动前端服务..."
echo "================================"

# 检查Node.js版本
echo "📋 Node.js版本:"
node --version

# 检查npm版本
echo "📋 npm版本:"
npm --version

# 检查当前目录
echo "📁 当前目录: $(pwd)"

# 检查package.json是否存在
if [ -f "package.json" ]; then
    echo "✅ package.json文件存在"
else
    echo "❌ 未找到package.json文件"
    exit 1
fi

# 杀死可能占用3000端口的进程
echo "🔧 清理端口3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "端口3000未被占用"

# 安装依赖
echo "📦 检查依赖..."
npm install

# 启动开发服务器
echo "🚀 启动Next.js开发服务器..."
npm run dev

# 如果上面失败，尝试其他方法
if [ $? -ne 0 ]; then
    echo "⚠️  npm run dev失败，尝试直接使用npx..."
    npx next dev
fi
