#!/usr/bin/env python3
"""
测试用户认证系统
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def print_section(title):
    print("\n" + "=" * 60)
    print(f"🧪 {title}")
    print("=" * 60)

def test_register():
    """测试用户注册"""
    print_section("测试用户注册")
    
    # 测试数据
    test_user = {
        'username': f'test_auth_user',
        'password': 'test123456',
        'email': 'test_auth@example.com',
        'native_language': 'English'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user,
            timeout=5
        )
        
        result = response.json()
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if result.get('success'):
            print("✅ 注册成功")
            return result['data']['user_id']
        else:
            print(f"⚠️  注册失败: {result.get('error')}")
            # 如果用户已存在，尝试登录获取user_id
            if '已存在' in result.get('error', ''):
                print("   用户已存在，将在后续测试中使用")
            return None
            
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")
        return None

def test_login(username='test_auth_user', password='test123456'):
    """测试用户登录"""
    print_section("测试用户登录")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={'username': username, 'password': password},
            timeout=5
        )
        
        result = response.json()
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if result.get('success'):
            print("✅ 登录成功")
            token = result['data']['session_token']
            print(f"   Session Token: {token[:20]}...")
            return token
        else:
            print(f"❌ 登录失败: {result.get('error')}")
            return None
            
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")
        return None

def test_get_current_user(token):
    """测试获取当前用户信息"""
    print_section("测试获取当前用户信息")
    
    if not token:
        print("❌ 没有有效的token")
        return False
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={'X-Session-Token': token},
            timeout=5
        )
        
        result = response.json()
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if result.get('success'):
            print("✅ 获取用户信息成功")
            return True
        else:
            print(f"❌ 获取失败: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")
        return False

def test_validate_session(token):
    """测试验证session"""
    print_section("测试Session验证")
    
    if not token:
        print("❌ 没有有效的token")
        return False
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/validate",
            headers={'X-Session-Token': token},
            timeout=5
        )
        
        result = response.json()
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if result.get('valid'):
            print("✅ Session有效")
            return True
        else:
            print(f"⚠️  Session无效: {result.get('reason')}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")
        return False

def test_logout(token):
    """测试用户登出"""
    print_section("测试用户登出")
    
    if not token:
        print("❌ 没有有效的token")
        return False
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={'X-Session-Token': token},
            timeout=5
        )
        
        result = response.json()
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if result.get('success'):
            print("✅ 登出成功")
            return True
        else:
            print(f"❌ 登出失败: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")
        return False

def test_default_password_login():
    """测试默认密码登录（测试用户）"""
    print_section("测试默认密码登录")
    print("尝试使用测试用户: test_user_001, 密码: password123")
    
    return test_login('test_user_001', 'password123')

def main():
    print("\n" + "🔐" * 30)
    print("用户认证系统测试")
    print("🔐" * 30)
    
    # 测试1: 注册新用户
    user_id = test_register()
    
    # 测试2: 登录
    token = test_login()
    
    # 如果登录失败，尝试使用默认密码
    if not token:
        print("\n⚠️  尝试使用测试用户和默认密码...")
        token = test_default_password_login()
    
    # 测试3: 获取当前用户信息
    if token:
        test_get_current_user(token)
        
        # 测试4: 验证session
        test_validate_session(token)
        
        # 测试5: 登出
        test_logout(token)
        
        # 测试6: 验证登出后的session
        test_validate_session(token)
    
    print("\n" + "=" * 60)
    print("🎉 测试完成！")
    print("=" * 60)
    print("\n💡 提示:")
    print("   - 如果所有测试都通过，说明认证系统正常工作")
    print("   - 现在可以在前端测试登录/注册功能")
    print("   - 访问 http://localhost:3000/login 测试登录")
    print("   - 访问 http://localhost:3000/register 测试注册")
    print()

if __name__ == '__main__':
    main()

