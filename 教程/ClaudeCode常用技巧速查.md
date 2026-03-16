# Claude Code 常用技巧速查

## 恢复历史对话

在 Claude Code 内部输入 `/resume`，即可列出最近的对话历史并选择恢复。

**其他恢复方式：**
- 启动时从 Welcome 界面右上角的 **Recent activity** 列表直接点选。
- 终端直接带参数启动：`claude --resume <对话ID>`。

**对话记录存放位置：**
所有对话历史 100% 存放在 `~/.claude/projects/` 目录下（即 `/Users/你的用户名/.claude/projects/`），项目文件夹内不会有任何对话数据。Claude Code 会把项目路径中的 `/` 和空格替换为 `-` 作为子文件夹名，例如：
```
~/.claude/projects/
└── -Users-kangzhengwei-Desktop-word-learning-system-2/   ← 该项目的全部对话
```

---

## 切换模型

在 Claude Code 内部输入 `/model`，即可从模型列表中选择切换。

---

## 禁用 Explore 子代理（非官方模型必做）

在项目根目录创建 `CLAUDE.md` 文件，写入以下内容，可避免非 Claude 原生模型因格式不兼容导致的 Explore 超时死机：

```markdown
# Claude Code Custom Instructions

## 架构探索与代码搜索规范 (CRITICAL)
当你被要求"梳理项目代码"、"分析整体架构"、"梳理接口类函数关系"或进行任何大范围的代码库探索时：

1. **绝对禁止**：严禁调用任何形式的 `Explore` 子代理。
2. **强制规范**：直接使用内置的 Grep、Glob、LS、Cat 等基础工具搜索。
3. **行为准则**：查到内容后直接在当前上下文中深度思考并作答。
```

---

## 更新 Claude Code 版本

```bash
npm install -g @anthropic-ai/claude-code@latest
claude --version   # 确认新版本号
```

---

## ⚠️ 版本升级后注意事项

升级后默认模型名字可能会变（如 `claude-3-7-sonnet-20250219` → `claude-sonnet-4-6`）。
如果你用了 NewAPI 模型映射，需要在映射表中**追加新版本的模型名**，否则请求会匹配不上。
