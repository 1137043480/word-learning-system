#!/usr/bin/env python3
"""
API保护测试脚本
验证所有受保护的API端点
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def print_section(title):
    print("\n" + "=" * 70)
    print(f"🧪 {title}")
    print("=" * 70)

def test_api_protection():
    """测试API保护"""
    print("\n🔒" * 35)
    print("API保护完整性测试")
    print("🔒" * 35)
    
    # 测试用户凭证
    user1 = {'username': 'test_user_001', 'password': 'password123'}
    user2 = {'username': 'test_user_002', 'password': 'password123'}
    
    print_section("1. 用户登录获取Token")
    
    # 用户1登录
    response1 = requests.post(f"{BASE_URL}/api/auth/login", json=user1)
    if response1.status_code == 200:
        result1 = response1.json()
        token1 = result1['data']['session_token']
        user_id1 = result1['data']['user_id']
        print(f"✅ 用户1登录成功: {user_id1}")
        print(f"   Token: {token1[:20]}...")
    else:
        print(f"❌ 用户1登录失败: {response1.text}")
        return
    
    # 用户2登录
    response2 = requests.post(f"{BASE_URL}/api/auth/login", json=user2)
    if response2.status_code == 200:
        result2 = response2.json()
        token2 = result2['data']['session_token']
        user_id2 = result2['data']['user_id']
        print(f"✅ 用户2登录成功: {user_id2}")
        print(f"   Token: {token2[:20]}...")
    else:
        print(f"❌ 用户2登录失败: {response2.text}")
        return
    
    # 测试列表
    tests = [
        {
            'name': 'Dashboard API',
            'url': f'/api/analytics/user/{user_id1}/dashboard',
            'method': 'GET',
        },
        {
            'name': '复习列表API',
            'url': f'/api/review/user/{user_id1}/due',
            'method': 'GET',
        },
        {
            'name': '用户进度API',
            'url': f'/api/analytics/user/{user_id1}/progress',
            'method': 'GET',
        },
        {
            'name': '智能推荐API',
            'url': f'/api/adaptive/recommendation/{user_id1}',
            'method': 'GET',
        },
        {
            'name': '用户会话API',
            'url': f'/api/users/{user_id1}/sessions/recent',
            'method': 'GET',
        },
    ]
    
    print_section("2. 测试用户1访问自己的数据（应该成功）")
    success_count = 0
    for test in tests:
        try:
            response = requests.request(
                test['method'],
                f"{BASE_URL}{test['url']}",
                headers={'X-Session-Token': token1},
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✅ {test['name']}: 访问成功")
                success_count += 1
            else:
                print(f"⚠️  {test['name']}: HTTP {response.status_code}")
                print(f"   响应: {response.text[:100]}")
        except Exception as e:
            print(f"❌ {test['name']}: {str(e)}")
    
    print(f"\n✅ 自己数据访问: {success_count}/{len(tests)} 成功")
    
    print_section("3. 测试用户1访问用户2的数据（应该403）")
    denied_count = 0
    tests_cross = [
        {
            'name': 'Dashboard API',
            'url': f'/api/analytics/user/{user_id2}/dashboard',
            'method': 'GET',
        },
        {
            'name': '复习列表API',
            'url': f'/api/review/user/{user_id2}/due',
            'method': 'GET',
        },
        {
            'name': '用户进度API',
            'url': f'/api/analytics/user/{user_id2}/progress',
            'method': 'GET',
        },
    ]
    
    for test in tests_cross:
        try:
            response = requests.request(
                test['method'],
                f"{BASE_URL}{test['url']}",
                headers={'X-Session-Token': token1},
                timeout=5
            )
            
            if response.status_code == 403:
                result = response.json()
                print(f"✅ {test['name']}: 正确拒绝 (403)")
                print(f"   错误: {result.get('error', 'N/A')}")
                denied_count += 1
            elif response.status_code == 200:
                print(f"❌ {test['name']}: 安全漏洞！应该拒绝但允许了访问")
            else:
                print(f"⚠️  {test['name']}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {test['name']}: {str(e)}")
    
    print(f"\n✅ 跨用户访问拒绝: {denied_count}/{len(tests_cross)} 成功")
    
    print_section("4. 测试未登录访问（应该401或403）")
    unauth_count = 0
    for test in tests[:3]:  # 测试前3个
        try:
            response = requests.request(
                test['method'],
                f"{BASE_URL}{test['url']}",
                timeout=5
            )
            
            if response.status_code in [401, 403]:
                print(f"✅ {test['name']}: 正确拒绝未认证请求 ({response.status_code})")
                unauth_count += 1
            elif response.status_code == 200:
                print(f"⚠️  {test['name']}: 允许未认证访问（向后兼容模式）")
            else:
                print(f"⚠️  {test['name']}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {test['name']}: {str(e)}")
    
    print(f"\n✅ 未认证访问控制: {unauth_count}/3 成功")
    
    print_section("5. 测试会话API保护")
    
    # 测试会话开始
    session_data = {
        'sessionId': 'test_session_12345',
        'userId': user_id1,
        'wordId': 1,
        'sessionType': 'learning',
        'moduleType': 'word',
        'startTime': '2025-11-22T10:00:00Z'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/learning/session/start",
            json=session_data,
            headers={'X-Session-Token': token1},
            timeout=5
        )
        
        if response.status_code == 200:
            print("✅ 会话开始API: 保护正常")
        else:
            print(f"⚠️  会话开始API: HTTP {response.status_code}")
            print(f"   响应: {response.text[:100]}")
    except Exception as e:
        print(f"❌ 会话开始API: {str(e)}")
    
    # 测试尝试为其他用户创建会话
    session_data_cross = {
        **session_data,
        'userId': user_id2,
        'sessionId': 'test_session_99999'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/learning/session/start",
            json=session_data_cross,
            headers={'X-Session-Token': token1},
            timeout=5
        )
        
        if response.status_code == 403:
            print("✅ 会话越权保护: 正确拒绝为他人创建会话")
        elif response.status_code == 200:
            print("❌ 会话越权保护: 安全漏洞！允许为他人创建会话")
        else:
            print(f"⚠️  会话越权保护: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ 会话越权保护: {str(e)}")
    
    print("\n" + "=" * 70)
    print("🎉 API保护测试完成！")
    print("=" * 70)
    print("\n📊 测试总结:")
    print(f"   ✅ 自己数据访问: {success_count}/{len(tests)}")
    print(f"   ✅ 跨用户拒绝: {denied_count}/{len(tests_cross)}")
    print(f"   ✅ 未认证拒绝: {unauth_count}/3")
    print("\n💡 如果所有测试都通过，说明API保护功能正常！\n")

if __name__ == '__main__':
    try:
        test_api_protection()
    except requests.exceptions.ConnectionError:
        print("\n❌ 无法连接到后端服务")
        print("💡 请先启动后端: python app_phase2.py\n")
    except Exception as e:
        print(f"\n❌ 测试失败: {str(e)}\n")

