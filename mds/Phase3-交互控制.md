# Phase 3：交互控制开发

> 本阶段目标：实现上一笔/下一笔/播放暂停等交互控制

---

## 3.1 扩展 HTML

在 `index.html` 的 `#input-area` 后添加：

```html
<!-- 交互控制区 -->
<div id="controls">
  <button id="prev-btn">◀ 上一笔</button>
  <button id="play-btn">▶ 播放</button>
  <button id="next-btn">下一笔 ▶</button>
</div>

<!-- 进度显示 -->
<div id="progress">第 <span id="current-stroke">0</span> 笔 / 共 <span id="total-strokes">0</span> 笔</div>

<style>
/* 添加样式 */
#controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
#controls button {
  min-width: 100px;
}
#progress {
  font-size: 16px;
  color: #666;
}
</style>
```

---

## 3.2 扩展渲染逻辑

在 `renderer.ts` 中添加：

```typescript
// 获取新元素
const prevBtn = document.getElementById('prev-btn')!;
const playBtn = document.getElementById('play-btn')!;
const nextBtn = document.getElementById('next-btn')!;
const currentStrokeSpan = document.getElementById('current-stroke')!;
const totalStrokesSpan = document.getElementById('total-strokes')!;

// 当前状态
let currentStrokeIndex = 0;
let totalStrokes = 0;
let isPlaying = false;

// 显示笔顺动画（更新版）
function showStrokeOrder(char: string) {
  container.innerHTML = '';
  
  writer = HanziWriter.create(container, char, {
    width: 280,
    height: 280,
    padding: 10,
    showOutline: true,
    showCharacter: false,
    strokeColor: '#333',
    outlineColor: '#ddd',
    drawingColor: '#4a90d9',
    onLoadCharDataSuccess: (data) => {
      totalStrokes = data.strokes.length;
      totalStrokesSpan.textContent = totalStrokes.toString();
      currentStrokeIndex = 0;
      currentStrokeSpan.textContent = '0';
    }
  });
}

// 上一笔
prevBtn.addEventListener('click', () => {
  if (!writer || currentStrokeIndex <= 0) return;
  currentStrokeIndex--;
  writer.hideStroke(currentStrokeIndex);
  currentStrokeSpan.textContent = currentStrokeIndex.toString();
});

// 下一笔
nextBtn.addEventListener('click', () => {
  if (!writer || currentStrokeIndex >= totalStrokes) return;
  writer.animateStroke(currentStrokeIndex, () => {
    currentStrokeIndex++;
    currentStrokeSpan.textContent = currentStrokeIndex.toString();
  });
});

// 播放/暂停
playBtn.addEventListener('click', () => {
  if (!writer) return;
  
  if (isPlaying) {
    writer.pauseAnimation();
    playBtn.textContent = '▶ 播放';
    isPlaying = false;
  } else {
    if (currentStrokeIndex >= totalStrokes) {
      // 重置并播放
      currentStrokeIndex = 0;
      currentStrokeSpan.textContent = '0';
      writer.animateCharacter();
    } else {
      // 继续播放
      writer.resumeAnimation();
    }
    playBtn.textContent = '⏸ 暂停';
    isPlaying = true;
  }
});
```

---

## 3.3 快捷键支持

在 `renderer.ts` 末尾添加：

```typescript
// 键盘快捷键
document.addEventListener('keydown', (e) => {
  // 避免在输入框中触发
  if (e.target === charInput) {
    if (e.key === 'Enter') return; // 回车是提交，不拦截
  }
  
  switch(e.key) {
    case 'ArrowLeft':  // 左箭头 = 上一笔
      prevBtn.click();
      break;
    case 'ArrowRight': // 右箭头 = 下一笔
      nextBtn.click();
      break;
    case ' ':          // 空格 = 播放/暂停
    case 'p':
    case 'P':
      e.preventDefault();
      playBtn.click();
      break;
  }
});
```

---

## 3.4 交付标准

- [ ] 上一笔/下一笔按钮正常工作
- [ ] 播放/暂停切换正常
- [ ] 进度显示正确
- [ ] 快捷键生效：
  - `←` 上一笔
  - `→` 下一笔
  - `空格` 或 `P` 播放/暂停

---

## 3.5 HanziWriter 关键 API

```typescript
// 动画控制
writer.animateCharacter()           // 播放完整动画
writer.animateStroke(index)         // 播放指定笔画
writer.pauseAnimation()             // 暂停
writer.resumeAnimation()            // 继续
writer.stopAnimation()              // 停止

// 笔画控制
writer.showStroke(index)            // 显示笔画
writer.hideStroke(index)            // 隐藏笔画
writer.showOutline()                // 显示轮廓
writer.hideOutline()                // 隐藏轮廓
```

---

*完成 Phase 3 后，进入 Phase 4：导出功能开发*
