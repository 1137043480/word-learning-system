#!/bin/bash

echo "🚀 启动自适应学习系统..."
echo "=================================="

# 检查当前目录
echo "📁 当前目录: $(pwd)"

# 创建测试数据
echo "📊 生成测试数据..."
python simple_test_data.py

# 启动第二阶段API服务
echo "🔧 启动第二阶段API服务 (端口5004)..."
python app_phase2.py &
API_PID=$!

sleep 3

# 检查API服务状态
if curl -s http://localhost:5004/api/stats > /dev/null 2>&1; then
    echo "✅ 第二阶段API服务启动成功"
else
    echo "⚠️  第二阶段API服务启动可能有问题"
fi

# 检查前端服务
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ 前端服务正在运行"
else
    echo "⚠️  前端服务未运行，请执行: npm run dev"
fi

echo ""
echo "🌐 访问地址:"
echo "   主页:           http://localhost:3000/"
echo "   第二阶段演示:    http://localhost:3000/phase2-demo"
echo "   学习Dashboard:  http://localhost:3000/learning-dashboard"
echo "   时间追踪演示:    http://localhost:3000/time-tracking-demo"
echo ""
echo "🔧 API测试:"
echo "   curl http://localhost:5004/api/stats"
echo "   curl http://localhost:5004/api/adaptive/recommendation/test_user_001"
echo ""
echo "⚠️  如果API服务有问题，请手动运行: python app_phase2.py"
echo "⚠️  如果前端服务未运行，请执行: npm run dev"

# 保持脚本运行
echo "按 Ctrl+C 停止API服务..."
wait $API_PID
