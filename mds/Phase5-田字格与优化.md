# Phase 5：田字格与优化

> 本阶段目标：添加田字格开关、优化 UI、完成打包

---

## 5.1 田字格功能

### HanziWriter 自带田字格

HanziWriter 本身支持田字格显示：

```typescript
const writer = HanziWriter.create(container, char, {
  width: 280,
  height: 280,
  padding: 5,
  
  // 笔顺颜色配置
  strokeColor: '#333',
  radicalColor: '#4a90d9',
  
  // 完成颜色
  drawingColor: '#4a90d9',
  
  // 显示轮廓
  showOutline: true,
  outlineColor: '#ddd',
  
  // 显示拼音
  showPinyin: false,
  
  // 显示笔画编号
  strokeAnimationSpeed: 1,
  delayBetweenStrokes: 200,
});
```

### 自定义田字格层

在 HTML 中叠加田字格：

```html
<div id="tianzige-container">
  <svg id="tianzige-svg"></svg>
  <div id="character-container"></div>
</div>

<style>
#tianzige-container {
  position: relative;
  width: 300px;
  height: 300px;
}
#tianzige-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
#character-container {
  position: relative;
  z-index: 1;
}
</style>
```

田字格 SVG 生成函数：

```typescript
function generateTianZiGeSVG(size: number): string {
  const padding = 10;
  const gridSize = size - padding * 2;
  
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 外框 -->
      <rect x="${padding}" y="${padding}" 
            width="${gridSize}" height="${gridSize}" 
            fill="none" stroke="#ccc" stroke-width="1"/>
      
      <!-- 横线 -->
      <line x1="${padding}" y1="${padding + gridSize/2}" 
            x2="${padding + gridSize}" y2="${padding + gridSize/2}" 
            stroke="#ccc" stroke-width="1"/>
      
      <!-- 竖线 -->
      <line x1="${padding + gridSize/2}" y1="${padding}" 
            x2="${padding + gridSize/2}" y2="${padding + gridSize}" 
            stroke="#ccc" stroke-width="1"/>
      
      <!-- 对角线 -->
      <line x1="${padding}" y1="${padding}" 
            x2="${padding + gridSize}" y2="${padding + gridSize}" 
            stroke="#eee" stroke-width="1" stroke-dasharray="5,5"/>
      <line x1="${padding + gridSize}" y1="${padding}" 
            x2="${padding}" y2="${padding + gridSize}" 
            stroke="#eee" stroke-width="1" stroke-dasharray="5,5"/>
    </svg>
  `;
}
```

---

## 5.2 田字格开关

```typescript
const tianzigeToggle = document.getElementById('tianzige-toggle') as HTMLInputElement;
const tianzigeSvg = document.getElementById('tianzige-svg')!;

tianzigeToggle.addEventListener('change', () => {
  tianzigeSvg.style.display = tianzigeToggle.checked ? 'block' : 'none';
});
```

---

## 5.3 速度调节

```html
<!-- 添加速度滑块 -->
<div id="speed-control">
  <label>速度：</label>
  <input type="range" id="speed-slider" min="0.5" max="3" step="0.5" value="1">
  <span id="speed-value">1x</span>
</div>
```

```typescript
const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
const speedValue = document.getElementById('speed-value')!;
let animationSpeed = 1;

speedSlider.addEventListener('input', () => {
  animationSpeed = parseFloat(speedSlider.value);
  speedValue.textContent = `${animationSpeed}x`;
  
  // 更新 writer 配置
  if (writer) {
    writer.setOptions({
      strokeAnimationSpeed: animationSpeed,
      delayBetweenStrokes: 200 / animationSpeed
    });
  }
});
```

---

## 5.4 打包配置

更新 `electrobun.config.ts`：

```typescript
import { defineConfig } from 'electrobun';

export default defineConfig({
  // 应用名称
  appName: '怎么写字',
  
  // 窗口配置
  window: {
    width: 500,
    height: 700,
    title: '怎么写字',
    resizable: true,
    minWidth: 400,
    minHeight: 600,
  },
  
  // 图标
  icon: './icon.png',
  
  // 构建配置
  build: {
    outDir: './dist',
    // Windows 打包
    windows: {
      target: ['nsis'], // 或 'portable' 单文件
    },
  },
  
  // 文件复制（字形数据）
  plugins: [
    {
      copyFiles: [
        './node_modules/hanzi-writer-data/*.json'
      ]
    }
  ]
});
```

---

## 5.5 打包命令

```bash
# 开发调试
bun run dev

# 生产打包
bun run build

# 打包 Windows exe
electrobun build --platform windows
```

---

## 5.6 最终验证清单

- [ ] 田字格显示正常
- [ ] 田字格开关有效
- [ ] 速度调节有效
- [ ] 快捷键全部可用
- [ ] GIF 导出正常
- [ ] 打包生成 exe
- [ ] exe 双击可运行
- [ ] 离线使用正常

---

## 5.7 项目收尾

1. **代码整理**：删除调试代码，添加注释
2. **README**：编写使用说明
3. **开源**：上传 GitHub
4. **发布**：发布 Release 版本

---

*Phase 5 完成！项目交付。*
