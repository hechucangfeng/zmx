type CharDataLoader = (char: string) => Promise<any>;

export async function generateGIF(
  text: string,
  localCharDataLoader: CharDataLoader,
  options: {
    width?: number;
    height?: number;
    frameDuration?: number;
    showTianZiGe?: boolean;
  } = {}
): Promise<Blob> {
  const {
    width = 400,
    height = 400,
    frameDuration = 200,
    showTianZiGe = false
  } = options;

  // 分割成单个汉字
  const chars = text.trim().split('');
  if (chars.length === 0) {
    throw new Error('请输入汉字');
  }

  // 创建隐藏的 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 收集所有帧
  const frames: ImageData[] = [];

  // 逐字生成帧
  for (const char of chars) {
    // 加载字形数据
      const charData = await localCharDataLoader(char);
      const strokes = charData.strokes;

    // 第一帧：只显示田字格（可选）
    if (showTianZiGe) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
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
