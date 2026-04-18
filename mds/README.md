# 怎么写字 - 开发指南

> 面向乡村语文教师的笔顺动画素材生成工具

---

## 📁 项目结构

```
怎么写字/
├── 开发文档/
│   ├── Phase1-初始化.md       # 项目搭建
│   ├── Phase2-基础功能.md     # 笔顺预览
│   ├── Phase3-交互控制.md     # 上一笔/下一笔
│   ├── Phase4-导出功能.md     # GIF 导出
│   └── Phase5-田字格与优化.md # 收尾
├── 需求文档.md                # 产品需求
└── TRAE参赛提案.md           # 参赛材料
```

---

## 🎯 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | electrobun（TypeScript 全栈） |
| 字形库 | HanziWriter |
| 导出 | Canvas + gif.js |
| 字形数据 | Make Me a Hanzi |

---

## 📋 开发阶段

| 阶段 | 目标 | 交付物 |
|------|------|--------|
| Phase 1 | 项目初始化 | 可运行的项目框架 |
| Phase 2 | 基础功能 | 单字笔顺动画预览 |
| Phase 3 | 交互控制 | 上一笔/下一笔/播放/暂停 |
| Phase 4 | 导出功能 | GIF 导出 |
| Phase 5 | 收尾优化 | 田字格/打包/发布 |

---

## 🚀 快速开始

```bash
# Phase 1
bun global add electrobun
electrobun create zenxie
cd zenxie
bun add hanzi-writer
bun run dev

# 按阶段完成开发后
electrobun build --platform windows
```

---

## ⌨️ 快捷键

| 键 | 功能 |
|----|------|
| `←` | 上一笔 |
| `→` | 下一笔 |
| `空格` / `P` | 播放/暂停 |
| `Ctrl+G` | 导出 GIF |
| `Ctrl+S` | 导出视频（V2） |

---

## 📦 核心 API（HanziWriter）

```typescript
// 创建
HanziWriter.create(container, char, options)

// 动画
writer.animateCharacter()      // 播放完整动画
writer.animateStroke(index)    // 播放单笔
writer.pauseAnimation()        // 暂停
writer.resumeAnimation()       // 继续

// 笔画控制
writer.showStroke(index)       // 显示笔画
writer.hideStroke(index)       // 隐藏笔画

// 数据
await HanziWriter.loadCharacterData(char)  // 加载字形数据
```

---

## 🔧 常见问题

| 问题 | 解决 |
|------|------|
| electrobun 安装失败 | 确保 Bun >= 1.0 |
| HanziWriter 加载慢 | 预加载常用字数据 |
| GIF 生成失败 | 检查 gif.js 依赖 |
| 打包体积大 | 使用精简字形库（3500字） |

---

## 📝 开发原则

1. **分阶段执行**：按 Phase 顺序开发，每阶段验证后再继续
2. **小步迭代**：每个功能单独调试通过后再组合
3. **AI 友好**：每个 Phase 文档独立，避免信息过载
4. **离线优先**：所有功能本地可运行，不依赖网络
