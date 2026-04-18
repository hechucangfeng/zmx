# Phase 1：项目初始化

> 本阶段目标：搭建 electrobun 项目框架，验证核心依赖可用

---

## 1.1 项目初始化

### 步骤 1：安装 electrobun CLI

```bash
# 确保已安装 Bun
bun --version

# 全局安装 electrobun CLI
bun global add electrobun

# 验证安装
electrobun --version
```

### 步骤 2：创建项目

```bash
# 创建新项目
electrobun create zenxie

# 项目类型选择：basic（基础模板）
# 语言选择：TypeScript
```

### 步骤 3：目录结构

```
zenxie/
├── src/
│   ├── main.ts          # 主进程入口
│   ├── renderer.ts      # 渲染进程入口
│   └── index.html       # 主页面
├── package.json
└── electrobun.config.ts # 配置文件
```

### 步骤 4：安装 HanziWriter

```bash
cd zenxie
bun add hanzi-writer
```

### 步骤 5：启动验证

```bash
bun run dev
```

打开 http://localhost:3000 ，验证：
- 窗口正常显示
- 无报错

---

## 1.2 交付标准

- [ ] `bun run dev` 能正常启动
- [ ] 窗口正常显示空白页面
- [ ] 无 TypeScript 报错
- [ ] HanziWriter 已安装（package.json 中可见）

---

## 1.3 常见问题

| 问题 | 解决方案 |
|------|----------|
| electrobun 安装失败 | 检查 Bun 版本，确保 >= 1.0 |
| 端口被占用 | 修改 electrobun.config.ts 中的端口 |
| TypeScript 报错 | `bun add -d @types/node` |

---

*完成 Phase 1 后，进入 Phase 2：基础功能开发*
