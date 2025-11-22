# 辅助脚本说明

## 📋 脚本列表

### 数据库相关
| 脚本名 | 功能 | 说明 |
|--------|------|------|
| `migrate_auth.py` | 认证数据库迁移 | 添加用户认证相关表和字段 |
| `migrate_database.py` | 数据库迁移 | 通用数据库结构更新 |

### 数据生成
| 脚本名 | 功能 | 说明 |
|--------|------|------|
| `generate_test_data.py` | 生成测试数据 | 创建测试用户和学习记录 |
| `simple_test_data.py` | 生成简单测试数据 | 快速创建基础测试数据 |
| `simulate_learning_records.js` | 模拟学习记录 | 前端学习记录模拟 |

### 数据导入
| 脚本名 | 功能 | 说明 |
|--------|------|------|
| `import_learning_materials.py` | 导入学习材料 | 批量导入词汇和学习资料 |
| `parse_learning_materials.py` | 解析学习材料 | 解析PPT和其他格式的学习资料 |

### 工具脚本
| 脚本名 | 功能 | 说明 |
|--------|------|------|
| `pdf_to_md.py` | PDF转Markdown | 将PDF文件转换为Markdown |
| `pdf_to_md_advanced.py` | PDF转Markdown（高级版） | 带更多选项的PDF转换 |

---

## 🚀 使用方法

### 数据库迁移脚本

#### migrate_auth.py - 认证系统迁移
**用途**: 为现有数据库添加用户认证功能

```bash
# 运行迁移
python scripts/migrate_auth.py
```

**功能**:
- ✅ 添加 `password_hash` 字段到 `user_profile` 表
- ✅ 添加 `email` 字段到 `user_profile` 表
- ✅ 创建 `user_session` 表
- ✅ 为现有用户设置默认密码

**输出示例**:
```
✅ 数据库迁移完成
✅ 为 51 个用户设置默认密码
```

---

#### migrate_database.py - 通用数据库迁移
**用途**: 通用数据库结构更新

```bash
python scripts/migrate_database.py
```

---

### 数据生成脚本

#### generate_test_data.py - 生成测试数据
**用途**: 创建完整的测试数据集

```bash
python scripts/generate_test_data.py
```

**生成内容**:
- 测试用户账号
- 学习会话记录
- 练习记录
- 用户进度数据

---

#### simple_test_data.py - 简单测试数据
**用途**: 快速创建基础测试数据

```bash
python scripts/simple_test_data.py
```

---

#### simulate_learning_records.js - 模拟学习记录
**用途**: 前端学习记录模拟

```bash
node scripts/simulate_learning_records.js
```

---

### 数据导入脚本

#### import_learning_materials.py - 导入学习材料
**用途**: 批量导入词汇和学习资料

```bash
# 基本用法
python scripts/import_learning_materials.py

# 指定文件
python scripts/import_learning_materials.py --file data/words.json
```

**支持格式**:
- JSON格式词汇数据
- 学习材料包

---

#### parse_learning_materials.py - 解析学习材料
**用途**: 从PPT等格式解析学习材料

```bash
# 解析PPT文件
python scripts/parse_learning_materials.py --input 词汇学习资料/第一次学习.pptx

# 解析并导入数据库
python scripts/parse_learning_materials.py --input 词汇学习资料/*.pptx --import
```

**支持格式**:
- PowerPoint (.pptx)
- JSON
- 其他学习材料格式

---

### 工具脚本

#### pdf_to_md.py - PDF转Markdown
**用途**: 将PDF文档转换为Markdown格式

```bash
# 基本用法
python scripts/pdf_to_md.py input.pdf

# 指定输出文件
python scripts/pdf_to_md.py input.pdf --output output.md
```

---

#### pdf_to_md_advanced.py - PDF转Markdown（高级版）
**用途**: 带更多选项的PDF转换

```bash
# 高级转换
python scripts/pdf_to_md_advanced.py input.pdf --preserve-images --extract-tables
```

**高级选项**:
- `--preserve-images`: 保留图片
- `--extract-tables`: 提取表格
- `--page-range`: 指定页面范围

---

## 📊 使用场景

### 场景1: 首次设置项目
```bash
# 1. 运行数据库迁移
python scripts/migrate_auth.py
python scripts/migrate_database.py

# 2. 生成测试数据
python scripts/generate_test_data.py

# 3. 导入学习材料
python scripts/import_learning_materials.py
```

### 场景2: 添加新词汇
```bash
# 1. 准备词汇数据（JSON或PPT）
# 2. 解析材料
python scripts/parse_learning_materials.py --input new_words.pptx

# 3. 导入数据库
python scripts/import_learning_materials.py --file parsed_data.json
```

### 场景3: 重置测试环境
```bash
# 1. 清空数据库（谨慎）
# 2. 重新迁移
python scripts/migrate_auth.py

# 3. 生成新测试数据
python scripts/generate_test_data.py
```

---

## 🔧 配置说明

### 数据库连接
大部分脚本使用以下默认数据库：
- **主数据库**: `words_extended.db`
- **备用数据库**: `words.db`

如需修改，请编辑脚本顶部的配置。

### 数据路径
学习材料默认路径：
- `data/learning_materials/`
- `词汇学习资料/`

---

## 📝 开发新脚本

### Python脚本模板

```python
#!/usr/bin/env python3
"""
脚本描述
"""

import sys
import os

def main():
    """主函数"""
    print("开始执行...")
    # 你的代码
    print("✅ 完成")

if __name__ == "__main__":
    main()
```

### 添加新脚本
1. 在 `scripts/` 目录创建新脚本
2. 添加可执行权限：`chmod +x scripts/your_script.py`
3. 更新本README文档

---

## ⚠️ 注意事项

### 数据库操作
- ⚠️ 运行迁移脚本前请备份数据库
- ⚠️ 不要在生产环境直接运行未测试的迁移
- ⚠️ 测试数据生成会覆盖现有测试数据

### 数据导入
- ⚠️ 检查数据格式是否正确
- ⚠️ 大批量导入前先测试小样本
- ⚠️ 注意数据重复问题

---

## 🐛 故障排查

### 常见问题

#### 1. 数据库锁定
```
database is locked
```
**解决方案**: 确保没有其他进程在访问数据库

#### 2. 导入失败
```
Import failed
```
**解决方案**: 检查数据格式，查看错误日志

#### 3. 权限错误
```
Permission denied
```
**解决方案**: 添加可执行权限
```bash
chmod +x scripts/your_script.py
```

---

## 📖 相关文档

- [开发文档](../docs/core/开发文档.md) - 系统架构
- [测试文档](../docs/core/测试文档.md) - 测试方法
- [测试脚本](../tests/README.md) - 测试脚本说明

---

**最后更新**: 2025年11月22日

