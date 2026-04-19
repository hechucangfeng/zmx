# 怎么写

一个功能强大的汉字笔顺演示应用，帮助用户学习和掌握汉字的正确书写顺序。

## 功能特性

- **汉字笔顺动画**：直观展示汉字的笔画顺序
- **田字格显示**：可切换田字格背景，辅助正确书写位置
- **交互式控制**：支持上一笔、下一笔、播放/暂停、重置等操作
- **多汉字支持**：可以输入多个汉字，依次演示每个汉字的笔顺
- **笔画演示导出**：支持导出笔画演示的 SVG 图片
- **完全离线**：汉字数据从本地加载，无需网络连接即可使用
- **自动更新**：支持 GitHub releases 自动更新推送

## 快速开始

### 前置要求

- [Bun](https://bun.sh/) >= 1.0

### 安装依赖

```bash
bun install
```

### 开发模式运行

```bash
bun run dev
```

### 生产环境构建

```bash
# 构建 stable 版本
bun run build:stable

# 构建 canary 版本
bun run build:canary

# 构建 dev 版本
bun run build:dev
```

构建产物位于 `build/` 目录，最终安装包在 `artifacts/` 目录。

## 项目结构

```
zenxie/
├── src/
│   ├── bun/
│   │   └── index.ts          # 主进程 - 窗口管理、RPC、汉字数据加载
│   ├── mainview/
│   │   ├── index.html       # 应用界面
│   │   ├── index.css        # 样式文件
│   │   └── index.ts         # 视图逻辑、HanziWriter 集成
│   ├── hanzi-controller.ts  # 笔画播放控制器
│   ├── gif-exporter.ts      # GIF 导出功能
│   └── examples.ts          # 功能示例
├── scripts/
│   └── prepare-data.ts      # 数据预处理脚本（构建前自动运行）
├── hanzi-writer-data/
│   └── data/                # 汉字笔画数据源 (9575+ 汉字)
├── build-data/              # 预处理后的数据（构建产物，ASCII 安全文件名）
├── electrobun.config.ts     # Electrobun 配置
└── package.json             # 项目配置
```

## 技术架构

### 离线数据加载

应用采用 **RPC 架构**实现完全离线运行：

```
┌─────────────────────────────────────────────────────────────┐
│                     应用进程 (Bun)                         │
│  ┌─────────────────┐    RPC 请求    ┌──────────────────┐  │
│  │   Webview      │ ──────────────→│  loadCharData   │  │
│  │ (渲染进程)      │ ←──────────────│  (本地文件读取)  │  │
│  │ charDataLoader │    汉字数据      │  带缓存          │  │
│  └─────────────────┘                └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                              ↓
                                    hanzi-writer-data/data/
                                    (9575 个汉字 JSON)
```

- **Bun 主进程**：通过 `loadCharData` RPC 处理器从本地文件系统读取汉字数据
- **Webview 渲染进程**：通过 `Electroview` RPC 调用获取数据
- **双层缓存**：Bun 端 + Webview 端缓存，避免重复 I/O

### 数据预处理

由于 Bun 的 tar 归档实现不支持超长文件名（中文 UTF-8 每字符 3 字节易超 POSIX tar 100 字节限制），构建前会自动运行预处理脚本：

```bash
bun run prepare-data
# 或自动在 build 命令前执行
bun run build:stable
```

- 将中文文件名转换为 Unicode 码点（如 `人.json` → `4EBA.json`）
- 生成 `_index.json` 索引文件
- 输出到 `build-data/` 目录

### 自动更新

应用支持 GitHub releases 自动更新：

- 更新源：https://github.com/hechucangfeng/zmx
- 检查间隔：1 小时
- 自动下载更新包，需手动安装

## 核心功能

1. **汉字输入**：在输入框中输入汉字，按回车或失焦后自动显示笔顺
2. **田字格切换**：通过复选框控制是否显示田字格背景
3. **笔画控制**：使用按钮控制笔画的播放、暂停、前进、后退和重置
4. **多汉字管理**：点击不同汉字切换控制对象
5. **导出功能**：生成并下载笔画演示的 SVG 图片

## 应用场景

- **教育教学**：教师用于课堂展示汉字笔顺
- **个人学习**：学生自学汉字书写
- **教材制作**：生成笔画演示图片用于教材
- **文化传播**：向非母语者展示汉字的书写之美

## 常见问题

### Q: 构建失败，提示 "ArchiveHeaderError"？

A: 这是因为中文文件名在 tar 归档时超长。确保使用 `bun run build:stable`（会自动运行预处理脚本）。如果手动运行构建，先执行 `bun run prepare-data`。

### Q: 离线模式下能使用多少汉字？

A: 当前数据包含 9575+ 常用汉字，基本覆盖日常使用需求。

### Q: 如何更新汉字数据？

A: 更新 `hanzi-writer-data` 包或手动添加新的汉字 JSON 文件到 `hanzi-writer-data/data/` 目录，然后重新构建。

---

希望这个应用能帮助你更好地学习和理解汉字！ 🎯
