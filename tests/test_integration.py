#!/usr/bin/env python3
"""
测试推荐和复习功能集成
"""

import requests
import json

BASE_URL = "http://localhost:5000"
TEST_USER = "test_user_001"

def test_api(endpoint, method='GET', data=None):
    """测试API端点"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == 'GET':
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json=data, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            return True, result
        else:
            return False, f"HTTP {response.status_code}"
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("🧪 测试推荐和复习功能集成")
    print("=" * 60)
    print()
    
    # 测试1: 智能推荐API
    print("1️⃣ 测试智能推荐API...")
    success, result = test_api(f"/api/adaptive/recommendation/{TEST_USER}")
    if success:
        print("   ✅ 推荐API正常")
        print(f"   📊 推荐类型: {result['data']['type']}")
        print(f"   📝 推荐词汇: {result['data'].get('word', 'N/A')}")
        print(f"   🎯 推荐模块: {result['data'].get('recommended_module', 'N/A')}")
        print(f"   💡 推荐理由: {result['data'].get('reason', 'N/A')}")
    else:
        print(f"   ❌ 推荐API失败: {result}")
    print()
    
    # 测试2: 复习列表API
    print("2️⃣ 测试复习列表API...")
    success, result = test_api(f"/api/review/user/{TEST_USER}/due?limit=5")
    if success:
        print("   ✅ 复习API正常")
        print(f"   📚 待复习词汇数量: {len(result['data'])}")
        if result['data']:
            for i, review in enumerate(result['data'][:3], 1):
                print(f"      {i}. {review['word']} - 掌握度: {review['mastery_level']:.2f}")
    else:
        print(f"   ❌ 复习API失败: {result}")
    print()
    
    # 测试3: Dashboard数据API
    print("3️⃣ 测试Dashboard数据API...")
    success, result = test_api(f"/api/analytics/user/{TEST_USER}/dashboard")
    if success:
        print("   ✅ Dashboard API正常")
        data = result['data']
        print(f"   📊 今日学习时间: {data['todayStats']['studyTimeMinutes']} 分钟")
        print(f"   📚 今日复习词汇: {data['todayStats']['wordsReviewed']}")
        print(f"   ✏️ 今日完成练习: {data['todayStats']['exercisesCompleted']}")
        print(f"   🎯 今日准确率: {data['todayStats']['averageAccuracy']:.1%}")
        print(f"   ⏰ 待复习词汇: {data['dueReviews']}")
    else:
        print(f"   ❌ Dashboard API失败: {result}")
    print()
    
    # 测试4: 用户进度API
    print("4️⃣ 测试用户进度API...")
    success, result = test_api(f"/api/analytics/user/{TEST_USER}/progress")
    if success:
        print("   ✅ 进度API正常")
        print(f"   📚 学习词汇数量: {len(result['data'])}")
    else:
        print(f"   ❌ 进度API失败: {result}")
    print()
    
    # 测试5: 系统统计API
    print("5️⃣ 测试系统统计API...")
    success, result = test_api("/api/stats")
    if success:
        print("   ✅ 统计API正常")
        data = result['data']
        print(f"   👥 总用户数: {data['totalUsers']}")
        print(f"   📚 总词汇数: {data['totalWords']}")
        print(f"   📝 总会话数: {data['totalSessions']}")
        print(f"   ✏️ 总练习数: {data['totalExercises']}")
        print(f"   🧠 自适应引擎: {'✅ 已启用' if data['adaptiveEngine'] else '❌ 未启用'}")
        print(f"   📅 间隔重复: {'✅ 已启用' if data['spacedRepetition'] else '❌ 未启用'}")
    else:
        print(f"   ❌ 统计API失败: {result}")
    print()
    
    print("=" * 60)
    print("🎉 测试完成！")
    print("=" * 60)
    print()
    print("💡 提示:")
    print("   - 如果所有测试都通过，说明后端API正常运行")
    print("   - 现在可以启动前端来测试完整的用户界面")
    print("   - 访问 http://localhost:3000 查看效果")
    print()

if __name__ == '__main__':
    main()

