# Phase 2：基础功能开发

> 本阶段目标：实现单字笔顺动画预览功能

---

## 2.1 页面布局

在 `src/index.html` 中实现：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>怎么写字</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 24px;
    }
    #character-container {
      width: 300px;
      height: 300px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    #input-area {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    #char-input {
      width: 200px;
      height: 48px;
      font-size: 24px;
      text-align: center;
      border: 2px solid #ddd;
      border-radius: 8px;
      outline: none;
    }
    #char-input:focus {
      border-color: #4a90d9;
    }
    button {
      height: 48px;
      padding: 0 24px;
      font-size: 16px;
      background: #4a90d9;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    button:hover {
      background: #357abd;
    }
    #stroke-info {
      font-size: 16px;
      color: #666;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <h1>怎么写字</h1>
  <div id="character-container"></div>
  <div id="input-area">
    <input type="text" id="char-input" placeholder="输入汉字" maxlength="1">
    <button id="show-btn">显示笔顺</button>
  </div>
  <div id="stroke-info"></div>
  
  <script type="module" src="./renderer.js"></script>
</body>
</html>
```

---

## 2.2 渲染逻辑

在 `src/renderer.ts` 中：

```typescript
import HanziWriter from 'hanzi-writer';

// 获取 DOM 元素
const container = document.getElementById('character-container')!;
const charInput = document.getElementById('char-input') as HTMLInputElement;
const showBtn = document.getElementById('show-btn')!;
const strokeInfo = document.getElementById('stroke-info')!;

// 当前 writer 实例
let writer: HanziWriter | null = null;

// 显示笔顺动画
function showStrokeOrder(char: string) {
  // 清除旧的
  container.innerHTML = '';
  
  // 创建新的 writer
  writer = HanziWriter.create(container, char, {
    width: 280,
    height: 280,
    padding: 10,
    showOutline: true,
    showCharacter: false,
    strokeColor: '#333',
    outlineColor: '#ddd',
    drawingColor: '#4a90d9',
  });
  
  // 显示信息
  const strokeCount = writer.character || 0;
  strokeInfo.textContent = `笔画数：${strokeCount}`;
  
  // 自动播放动画
  writer.animateCharacter();
}

// 绑定事件
showBtn.addEventListener('click', () => {
  const char = charInput.value.trim();
  if (char) {
    showStrokeOrder(char);
  }
});

// 回车也能触发
charInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const char = charInput.value.trim();
    if (char) {
      showStrokeOrder(char);
    }
  }
});
```

---

## 2.3 验证运行

```bash
bun run dev
```

测试：
- 输入"龙"，点击"显示笔顺"
- 应显示笔顺动画
- 底部显示笔画数

---

## 2.4 交付标准

- [ ] 页面正常显示
- [ ] 输入汉字后点击按钮显示笔顺动画
- [ ] 动画播放正常
- [ ] 无控制台报错

---

## 2.5 常见问题

| 问题 | 解决方案 |
|------|----------|
| HanziWriter 加载失败 | 检查是否正确导入，检查网络 |
| 动画不显示 | 确保容器 div 有宽高 |
| 中文输入被过滤 | 确保 maxlength="1"，用 trim() 处理 |

---

*完成 Phase 2 后，进入 Phase 3：交互控制开发*
