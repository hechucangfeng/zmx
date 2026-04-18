# Phase 4：导出功能开发

> 本阶段目标：实现 GIF 导出功能

---

## 4.1 核心思路

GIF 导出的实现方式：
1. 创建一个隐藏的 Canvas
2. 通过 HanziWriter 的 `getSvgString()` 获取每一帧的 SVG
3. 将 SVG 转为 Canvas 绘制
4. 使用 gif.js 或原生 Canvas 逐帧生成 GIF

---

## 4.2 添加 GIF 库

```bash
bun add gif.js
bun add -d @types/gif.js
```

或者使用更轻量的方案：用原生 Canvas + Blob

---

## 4.3 GIF 导出模块

创建 `src/gif-exporter.ts`：

```typescript
import HanziWriter from 'hanzi-writer';

/**
 * 生成笔顺动画 GIF
 * @param char 汉字
 * @param options 配置选项
 */
export async function generateGIF(
  char: string,
  options: {
    width?: number;
    height?: number;
    frameDuration?: number;  // 每帧持续时间 ms
    showTianZiGe?: boolean; // 是否显示田字格
  } = {}
): Promise<Blob> {
  const {
    width = 400,
    height = 400,
    frameDuration = 200,
    showTianZiGe = false
  } = options;

  // 加载字形数据
  const charData = await HanziWriter.loadCharacterData(char);
  const strokes = charData.strokes;

  // 创建隐藏的 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 收集所有帧
  const frames: ImageData[] = [];

  // 第一帧：只显示田字格（可选）
  if (showTianZiGe) {
    drawTianZiGe(ctx, width, height);
    frames.push(ctx.getImageData(0, 0, width, height));
  }

  // 逐笔添加帧
  for (let i = 0; i < strokes.length; i++) {
    // 重绘（带之前所有笔画）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    if (showTianZiGe) {
      drawTianZiGe(ctx, width, height);
    }
    
    // 绘制到当前笔画
    for (let j = 0; j <= i; j++) {
      drawStroke(ctx, strokes[j], width, height);
    }
    
    frames.push(ctx.getImageData(0, 0, width, height));
  }

  // 使用原生方法生成 GIF
  return canvasToGIF(frames, frameDuration);
}

/**
 * 绘制田字格
 */
function drawTianZiGe(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const padding = 20;
  const gridW = w - padding * 2;
  const gridH = h - padding * 2;
  
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  
  // 外框
  ctx.strokeRect(padding, padding, gridW, gridH);
  
  // 横线
  ctx.beginPath();
  ctx.moveTo(padding, padding + gridH / 2);
  ctx.lineTo(padding + gridW, padding + gridH / 2);
  ctx.stroke();
  
  // 竖线
  ctx.beginPath();
  ctx.moveTo(padding + gridW / 2, padding);
  ctx.lineTo(padding + gridW / 2, padding + gridH);
  ctx.stroke();
  
  // 斜线
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding + gridW, padding + gridH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(padding + gridW, padding);
  ctx.lineTo(padding, padding + gridH);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * 绘制单笔
 */
function drawStroke(ctx: CanvasRenderingContext2D, pathData: string, w: number, h: number) {
  ctx.fillStyle = '#333333';
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // 简单 SVG 路径转 Canvas
  const path = new Path2D(pathData);
  
  // 缩放到 canvas 尺寸（SVG 默认是 1024x1024）
  ctx.save();
  ctx.translate(w * 0.1, h * 0.1);
  ctx.scale(w * 0.8 / 1024, h * 0.8 / 1024);
  ctx.fill(path);
  ctx.restore();
}

/**
 * Canvas 帧序列转 GIF Blob
 */
async function canvasToGIF(frames: ImageData[], delay: number): Promise<Blob> {
  // 简化版：使用 gif.js
  const GIF = (await import('gif.js')).default;
  
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: frames[0].width,
    height: frames[0].height,
    workerScript: './gif.worker.js'
  });

  // 创建临时 canvas
  const canvas = document.createElement('canvas');
  canvas.width = frames[0].width;
  canvas.height = frames[0].height;
  const ctx = canvas.getContext('2d')!;

  for (const frame of frames) {
    ctx.putImageData(frame, 0, 0);
    gif.addFrame(canvas, { delay, copy: true });
  }

  return new Promise((resolve) => {
    gif.on('finished', (blob: Blob) => {
      resolve(blob);
    });
    gif.render();
  });
}
```

---

## 4.4 下载功能

在 `renderer.ts` 中添加：

```typescript
// 添加导出按钮 HTML
// <button id="export-gif-btn">导出 GIF</button>

const exportGifBtn = document.getElementById('export-gif-btn')!;

// 导出 GIF
exportGifBtn.addEventListener('click', async () => {
  const char = charInput.value.trim();
  if (!char || !writer) {
    alert('请先输入并显示汉字');
    return;
  }

  exportGifBtn.disabled = true;
  exportGifBtn.textContent = '生成中...';

  try {
    const blob = await generateGIF(char, {
      width: 720,
      height: 720,
      frameDuration: 300,
      showTianZiGe: false
    });

    // 下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${char}_笔顺.gif`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('导出失败:', err);
    alert('导出失败，请重试');
  } finally {
    exportGifBtn.disabled = false;
    exportGifBtn.textContent = '导出 GIF';
  }
});
```

---

## 4.5 交付标准

- [ ] 点击"导出 GIF"按钮
- [ ] 显示"生成中..."状态
- [ ] 生成完成后自动下载 GIF 文件
- [ ] GIF 中笔顺动画播放正常
- [ ] 田字格显示正确（如果开启）

---

## 4.6 简化方案（如果 gif.js 集成复杂）

如果 gif.js 集成有问题，可以用简化方案：

```typescript
// 简化版：导出为 PNG 序列（让用户手动合成）
async function exportFrames(char: string) {
  const charData = await HanziWriter.loadCharacterData(char);
  
  for (let i = 0; i < charData.strokes.length; i++) {
    const writer = HanziWriter.create('hidden-container', char, {
      // ... 配置
    });
    
    // 隐藏到动画第 i 帧
    for (let j = 0; j < charData.strokes.length; j++) {
      if (j <= i) writer.showStroke(j);
      else writer.hideStroke(j);
    }
    
    // 获取 SVG 并转为图片下载
    const svg = document.querySelector('#hidden-container svg')?.innerHTML;
    // ...
  }
}
```

---

*完成 Phase 4 后，进入 Phase 5：田字格与优化*
