# 测试文件说明

## 📋 测试文件列表

### Python测试
| 文件名 | 测试内容 | 说明 |
|--------|----------|------|
| `test_auth.py` | 用户认证系统 | 注册、登录、登出、Session管理 |
| `test_api_protection.py` | API权限保护 | 数据隔离、权限验证 |
| `test_integration.py` | 推荐和复习功能 | 智能推荐、复习调度集成测试 |

### JavaScript测试
| 文件名 | 测试内容 | 说明 |
|--------|----------|------|
| `test_time_tracking.js` | 时间追踪 | 前端时间追踪功能测试 |

---

## 🚀 运行测试

### 前提条件
1. 确保后端服务已启动：
   ```bash
   python app_phase2.py
   ```

2. 确保前端服务已启动（如果需要测试前端功能）：
   ```bash
   npm run dev
   ```

### 运行Python测试

**从项目根目录运行**（推荐）：

```bash
# 进入项目根目录
cd "/Users/kangzhengwei/Desktop/word learning system 2"

# 运行认证系统测试
python tests/test_auth.py

# 运行API保护测试
python tests/test_api_protection.py

# 运行集成测试
python tests/test_integration.py
```

### 运行JavaScript测试

```bash
# 从项目根目录运行
node tests/test_time_tracking.js
```

---

## 🧪 测试详细说明

### 1. test_auth.py - 认证系统测试

**测试内容**：
- ✅ 用户注册功能
- ✅ 用户登录功能
- ✅ Session验证
- ✅ 用户信息获取
- ✅ 用户登出功能
- ✅ 默认密码登录测试

**运行示例**：
```bash
python tests/test_auth.py
```

**预期输出**：
```
🧪 测试用户注册
✅ 注册成功

🧪 测试用户登录
✅ 登录成功
Session Token: xxx...
```

---

### 2. test_api_protection.py - API保护测试

**测试内容**：
- ✅ 认证访问测试
- ✅ 未授权访问测试
- ✅ 跨用户访问测试
- ✅ 数据隔离验证

**运行示例**：
```bash
python tests/test_api_protection.py
```

---

### 3. test_integration.py - 集成测试

**测试内容**：
- ✅ 智能推荐API
- ✅ 复习列表API
- ✅ Dashboard数据API
- ✅ 用户进度API
- ✅ 系统统计API

**运行示例**：
```bash
python tests/test_integration.py
```

**预期输出**：
```
🧪 测试API端点
1. 智能推荐API: ✅
2. 复习列表API: ✅
3. Dashboard数据API: ✅
...
```

---

### 4. test_time_tracking.js - 时间追踪测试

**测试内容**：
- ✅ 时间追踪功能
- ✅ 前端计时器测试

**运行示例**：
```bash
node tests/test_time_tracking.js
```

---

## 📊 使用pytest（可选）

如果安装了pytest，可以更方便地运行测试：

### 安装pytest
```bash
pip install pytest
```

### 运行所有测试
```bash
pytest tests/
```

### 运行特定测试
```bash
pytest tests/test_auth.py -v
```

### 运行并显示详细输出
```bash
pytest tests/ -v -s
```

---

## 🔧 测试配置

### 测试环境配置

所有测试使用以下默认配置：
- **后端URL**: `http://localhost:5000`
- **前端URL**: `http://localhost:3000`
- **测试用户**: `test_user_001`（部分测试）

如需修改配置，请编辑各测试文件顶部的配置常量。

---

## 📝 编写新测试

### Python测试模板

```python
#!/usr/bin/env python3
"""
测试描述
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_your_feature():
    """测试你的功能"""
    try:
        response = requests.get(f"{BASE_URL}/api/your-endpoint")
        if response.status_code == 200:
            print("✅ 测试通过")
        else:
            print(f"❌ 测试失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    test_your_feature()
```

### 添加新测试
1. 在 `tests/` 目录创建新测试文件（命名为 `test_*.py` 或 `test_*.js`）
2. 编写测试代码
3. 更新本README文档

---

## 🐛 故障排查

### 常见问题

#### 1. 连接被拒绝
```
Connection refused
```
**解决方案**: 确保后端服务正在运行
```bash
python app_phase2.py
```

#### 2. 404错误
```
HTTP 404
```
**解决方案**: 检查API端点是否正确，确认后端路由已注册

#### 3. Session无效
```
Session invalid
```
**解决方案**: 重新登录获取新的Session Token

---

## 📖 相关文档

- [开发文档](../docs/core/开发文档.md) - 系统架构和API文档
- [测试文档](../docs/core/测试文档.md) - 测试策略和规范
- [移动端测试指南](../docs/guides/移动端测试指南.md) - 移动端测试方法

---

**最后更新**: 2025年11月22日

