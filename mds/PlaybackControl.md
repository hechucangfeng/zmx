# HanziWriter 播放/暂停和笔画控制实现方案

## 概述

HanziWriter 库本身提供了 `pauseAnimation()` 和 `resumeAnimation()` 方法，但没有直接的"上一笔"和"下一笔"控制。本文档提供完整的实现方案。

---

## 1. HanziWriter 原生支持的方法

根据官方文档，以下方法直接可用：

### 1.1 播放/暂停控制
- **`writer.pauseAnimation()`** - 暂停当前正在运行的任何动画
- **`writer.resumeAnimation()`** - 继续之前暂停的动画

### 1.2 笔画动画方法
- **`writer.animateStroke(strokeNum, options)`** - 播放单个笔画动画
  - `strokeNum`: 笔画编号（从 0 开始）
  - `options.onComplete`: 动画完成时的回调

- **`writer.highlightStroke(strokeNum, options)`** - 突出显示单个笔画
  
- **`writer.animateCharacter(options)`** - 播放所有笔画的动画

### 1.3 获取笔画数据
要实现"上一笔""下一笔"功能，需要获取字符的笔画数据：

```javascript
// 加载字符数据以获取笔画信息
HanziWriter.loadCharacterData('我').then(function(charData) {
  console.log(charData.strokes.length);  // 笔画总数
  console.log(charData.strokes);         // 所有笔画的路径数据
});
```

---

## 2. 播放/暂停功能实现

### 2.1 基础实现

```typescript
class HanziController {
  private writer: HanziWriter;
  private isPlaying: boolean = false;

  constructor(writer: HanziWriter) {
    this.writer = writer;
  }

  // 播放/暂停切换
  togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // 播放
  play(): void {
    this.writer.resumeAnimation();
    this.isPlaying = true;
  }

  // 暂停
  pause(): void {
    this.writer.pauseAnimation();
    this.isPlaying = false;
  }

  // 获取当前状态
  getPlayStatus(): boolean {
    return this.isPlaying;
  }
}
```

### 2.2 UI 按钮集成

```html
<div class="controls">
  <button id="play-pause-btn">▶ 播放</button>
</div>
```

```typescript
const playPauseBtn = document.getElementById('play-pause-btn')!;
playPauseBtn.addEventListener('click', () => {
  controller.togglePlayPause();
  playPauseBtn.textContent = controller.getPlayStatus() ? '⏸ 暂停' : '▶ 播放';
});
```

---

## 3. 上一笔/下一笔功能实现

### 关键概念

由于 HanziWriter 没有直接的"上一笔""下一笔"API，需要通过以下方式实现：

1. **跟踪当前笔画索引** - 维护一个状态变量记录当前播放到第几笔
2. **预加载笔画数据** - 获取字符的总笔画数
3. **控制笔画播放** - 使用 `animateStroke()` 播放单个笔画
4. **重置字符状态** - 使用 `hideCharacter()` 清空已显示的笔画

### 3.1 完整实现

```typescript
class StrokeNavigator {
  private writer: HanziWriter;
  private character: string;
  private currentStrokeIndex: number = 0;
  private totalStrokes: number = 0;
  private charData: any = null;
  private isAnimating: boolean = false;

  constructor(writer: HanziWriter, character: string) {
    this.writer = writer;
    this.character = character;
    this.loadCharacterData();
  }

  // 加载字符数据
  private async loadCharacterData(): Promise<void> {
    try {
      this.charData = await HanziWriter.loadCharacterData(this.character);
      this.totalStrokes = this.charData.strokes.length;
      console.log(`字符 ${this.character} 共有 ${this.totalStrokes} 笔`);
    } catch (error) {
      console.error('加载字符数据失败:', error);
    }
  }

  // 获取总笔画数
  getTotalStrokes(): number {
    return this.totalStrokes;
  }

  // 获取当前笔画索引
  getCurrentStrokeIndex(): number {
    return this.currentStrokeIndex;
  }

  // 播放下一笔
  nextStroke(): void {
    if (this.isAnimating) return;
    
    if (this.currentStrokeIndex < this.totalStrokes - 1) {
      this.currentStrokeIndex++;
      this.playCurrentStroke();
    } else {
      console.warn('已经是最后一笔');
    }
  }

  // 播放上一笔
  previousStroke(): void {
    if (this.isAnimating) return;
    
    if (this.currentStrokeIndex > 0) {
      this.currentStrokeIndex--;
      this.resetToStroke(this.currentStrokeIndex);
    } else {
      console.warn('已经是第一笔');
    }
  }

  // 播放当前笔画
  private playCurrentStroke(): void {
    if (this.currentStrokeIndex >= this.totalStrokes) {
      return;
    }

    this.isAnimating = true;

    // 需要通过 setCharacter 重新加载，然后播放到当前笔画
    // 这是一个巧妙的方案：隐藏所有笔画，然后逐笔播放直到当前笔画
    this.writer.hideCharacter();
    
    this.animateStrokesUpTo(0);
  }

  // 递归播放笔画直到指定索引
  private animateStrokesUpTo(index: number): void {
    if (index > this.currentStrokeIndex) {
      this.isAnimating = false;
      return;
    }

    this.writer.animateStroke(index, {
      onComplete: () => {
        this.animateStrokesUpTo(index + 1);
      }
    });
  }

  // 重置到指定笔画之前的状态
  private resetToStroke(targetIndex: number): void {
    this.isAnimating = true;
    
    // 隐藏所有笔画
    this.writer.hideCharacter();
    
    // 重新播放到目标笔画
    this.animateStrokesUpTo(0);
  }

  // 跳转到指定笔画
  goToStroke(strokeIndex: number): void {
    if (this.isAnimating) return;
    
    if (strokeIndex < 0 || strokeIndex >= this.totalStrokes) {
      console.error('笔画索引超出范围');
      return;
    }

    this.currentStrokeIndex = strokeIndex;
    this.playCurrentStroke();
  }

  // 重置（回到开始）
  reset(): void {
    this.currentStrokeIndex = 0;
    this.writer.hideCharacter();
  }

  // 播放所有笔画
  playAll(): void {
    this.reset();
    this.writer.animateCharacter();
    this.currentStrokeIndex = this.totalStrokes - 1;
  }

  // 状态信息
  getStatusInfo(): string {
    return `第 ${this.currentStrokeIndex + 1} / ${this.totalStrokes} 笔`;
  }
}
```

---

## 4. UI 集成示例

### 4.1 HTML 结构

```html
<div id="character-display"></div>

<div class="controls">
  <button id="prev-btn">◀ 上一笔</button>
  <button id="play-btn">▶ 播放/暂停</button>
  <button id="next-btn">下一笔 ▶</button>
  <button id="reset-btn">复位</button>
  <button id="play-all-btn">全部播放</button>
</div>

<div id="stroke-counter">第 1 / 5 笔</div>
```

### 4.2 TypeScript 集成

```typescript
import HanziWriter from 'hanzi-writer';

// 创建 writer 实例
const writer = HanziWriter.create('character-display', '我', {
  width: 300,
  height: 300,
  padding: 20,
  showOutline: true,
  showCharacter: false,
  strokeAnimationSpeed: 2
});

// 创建导航控制器
const navigator = new StrokeNavigator(writer, '我');

// 绑定按钮事件
document.getElementById('prev-btn')?.addEventListener('click', () => {
  navigator.previousStroke();
  updateUI();
});

document.getElementById('next-btn')?.addEventListener('click', () => {
  navigator.nextStroke();
  updateUI();
});

document.getElementById('play-btn')?.addEventListener('click', () => {
  // 实现播放/暂停逻辑
  navigator.playAll();
});

document.getElementById('reset-btn')?.addEventListener('click', () => {
  navigator.reset();
  updateUI();
});

document.getElementById('play-all-btn')?.addEventListener('click', () => {
  navigator.playAll();
  updateUI();
});

// 更新 UI 显示
function updateUI() {
  const counter = document.getElementById('stroke-counter');
  if (counter) {
    counter.textContent = navigator.getStatusInfo();
  }
}

// 初始化
updateUI();
```

---

## 5. 高级实现细节

### 5.1 性能优化

由于"上一笔"需要重新播放所有之前的笔画，可以考虑缓存已显示的笔画：

```typescript
class OptimizedStrokeNavigator extends StrokeNavigator {
  private animatedStrokesCache: Set<number> = new Set();

  previousStrokeOptimized(): void {
    // 如果已缓存，直接使用缓存的动画
    if (this.animatedStrokesCache.has(this.currentStrokeIndex - 1)) {
      this.previousStroke();
    } else {
      // 否则重新计算
      this.previousStroke();
    }
  }
}
```

### 5.2 处理多字符场景

如果应用中有多个字符并行显示：

```typescript
class MultiCharacterController {
  private navigators: Map<string, StrokeNavigator> = new Map();
  private activeCharId: string | null = null;

  addCharacter(charId: string, writer: HanziWriter, char: string): void {
    this.navigators.set(charId, new StrokeNavigator(writer, char));
    this.activeCharId = charId;
  }

  switchCharacter(charId: string): void {
    this.activeCharId = charId;
  }

  nextStroke(): void {
    if (this.activeCharId) {
      this.navigators.get(this.activeCharId)?.nextStroke();
    }
  }

  previousStroke(): void {
    if (this.activeCharId) {
      this.navigators.get(this.activeCharId)?.previousStroke();
    }
  }
}
```

---

## 6. API 限制和解决方案总结

| 功能需求 | 直接API支持 | 解决方案 |
|---------|-----------|--------|
| 播放 | ✅ `resumeAnimation()` | 直接使用 |
| 暂停 | ✅ `pauseAnimation()` | 直接使用 |
| 下一笔 | ❌ 无 | 使用 `animateStroke(currentIndex + 1)` |
| 上一笔 | ❌ 无 | 隐藏所有笔画，重新逐笔播放到目标笔画 |
| 获取笔画总数 | ✅ `HanziWriter.loadCharacterData()` | 加载数据后读取 `strokes.length` |
| 跳转到指定笔画 | ❌ 无 | 结合隐藏和逐笔播放实现 |

---

## 7. 完整工作流程

```
用户交互
  ↓
按下"下一笔"按钮
  ↓
currentStrokeIndex++
  ↓
animateStroke(currentStrokeIndex)
  ↓
笔画动画完成
  ↓
更新 UI 计数器

---

用户交互
  ↓
按下"上一笔"按钮
  ↓
currentStrokeIndex--
  ↓
hideCharacter()
  ↓
递归 animateStroke(0→currentStrokeIndex)
  ↓
所有笔画重新播放完成
  ↓
更新 UI 计数器
```

---

## 8. 参考资源

- [HanziWriter 官方文档](https://hanziwriter.org/cn/docs.html)
- [HanziWriter GitHub](https://github.com/chanind/hanzi-writer)
- 核心可用方法：
  - `pauseAnimation()`
  - `resumeAnimation()`
  - `animateStroke(strokeNum, options)`
  - `hideCharacter(options)`
  - `HanziWriter.loadCharacterData(character, options)`

---

## 9. 注意事项

1. **性能考虑**：上一笔功能需要重新播放所有之前的笔画，大笔画数字符会有延迟
2. **状态管理**：需要维护 `isAnimating` 标志防止状态混乱
3. **错误处理**：加载字符数据可能失败，需要proper错误处理
4. **暂停恢复**：暂停后如果改变了笔画索引，resumeAnimation() 的行为可能不符合预期
5. **多字符场景**：应用中多个 writer 实例需要独立的导航状态

