#!/usr/bin/env python3
"""
快速启动第二阶段API服务
解决终端输出问题
"""

import os
import subprocess
import time
import requests

def start_api_service():
    """启动第二阶段API服务"""
    print("🚀 启动第二阶段API服务...")
    
    # 启动服务
    try:
        process = subprocess.Popen(
            ['python', 'app_phase2.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # 等待服务启动
        print("⏳ 等待服务启动...")
        time.sleep(5)
        
        # 测试服务是否正常
        try:
            response = requests.get('http://localhost:5004/api/stats', timeout=5)
            if response.status_code == 200:
                print("✅ 第二阶段API服务启动成功！")
                print("🌐 服务地址: http://localhost:5004")
                print("📊 系统统计: http://localhost:5004/api/stats")
                print("🎯 智能推荐: http://localhost:5004/api/adaptive/recommendation/test_user_001")
                return True
            else:
                print(f"⚠️  服务响应异常: HTTP {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ 服务连接失败: {str(e)}")
            return False
            
    except Exception as e:
        print(f"❌ 启动失败: {str(e)}")
        return False

def check_frontend():
    """检查前端服务状态"""
    try:
        response = requests.get('http://localhost:3000/', timeout=5)
        if response.status_code == 200:
            print("✅ 前端服务正在运行: http://localhost:3000")
            return True
        else:
            print("⚠️  前端服务响应异常")
            return False
    except requests.exceptions.RequestException:
        print("❌ 前端服务未运行，请执行: npm run dev")
        return False

def main():
    print("=" * 50)
    print("🎯 自适应学习系统快速启动")
    print("=" * 50)
    
    # 检查前端
    frontend_ok = check_frontend()
    
    # 启动API
    api_ok = start_api_service()
    
    print("\n" + "=" * 50)
    print("📋 系统状态总结:")
    print(f"   前端服务: {'✅ 正常' if frontend_ok else '❌ 异常'}")
    print(f"   API服务:  {'✅ 正常' if api_ok else '❌ 异常'}")
    
    if frontend_ok and api_ok:
        print("\n🎉 系统启动完成！请访问:")
        print("   🏠 主页: http://localhost:3000/")
        print("   🖥️ 系统状态: http://localhost:3000/system-status")
        print("   🚀 功能演示: http://localhost:3000/phase2-demo")
        print("   📊 学习分析: http://localhost:3000/learning-dashboard")
    else:
        print("\n⚠️  部分服务异常，请检查日志")
    
    print("=" * 50)

if __name__ == '__main__':
    main()
