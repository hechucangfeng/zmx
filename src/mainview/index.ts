import HanziWriter from 'hanzi-writer';

// 获取 DOM 元素
const container = document.getElementById('characters-container')!;
const charInput = document.getElementById('char-input') as HTMLInputElement;
const strokeInfo = document.getElementById('stroke-info')!;
const gridToggle = document.getElementById('grid-toggle') as HTMLInputElement;
const prevBtn = document.getElementById('prev-btn')!;
const playPauseBtn = document.getElementById('play-pause-btn')!;
const nextBtn = document.getElementById('next-btn')!;
const resetBtn = document.getElementById('reset-btn')!;
const playAllBtn = document.getElementById('play-all-btn')!;
const strokeCounter = document.getElementById('stroke-counter')!;

// 当前 writer 实例数组
let writers: HanziWriter[] = [];

// 笔画导航器类
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
      this.updateStrokeCounter();
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
      this.updateStrokeCounter();
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
    this.updateStrokeCounter();
  }

  // 播放所有笔画
  playAll(): void {
    this.reset();
    this.writer.animateCharacter({
      onComplete: () => {
        this.currentStrokeIndex = this.totalStrokes - 1;
        this.updateStrokeCounter();
        // 动画完成后，将控制器状态设置为非播放状态
        controller.isPlaying = false;
        // 更新播放按钮的文字
        if (playPauseBtn) {
          playPauseBtn.textContent = '▶ 播放';
        }
      }
    });
  }

  // 状态信息
  getStatusInfo(): string {
    return `第 ${this.currentStrokeIndex + 1} / ${this.totalStrokes} 笔`;
  }

  // 更新笔画计数器
  updateStrokeCounter(): void {
    if (strokeCounter) {
      strokeCounter.textContent = this.getStatusInfo();
    }
  }

  // 暂停动画
  pause(): void {
    this.writer.pauseAnimation();
  }

  // 恢复动画
  resume(): void {
    this.writer.resumeAnimation();
  }
}

// 播放控制器类
class HanziController {
  private navigator: StrokeNavigator | null = null;
  private isPlaying: boolean = false;

  constructor() {}

  // 设置导航器
  setNavigator(navigator: StrokeNavigator): void {
    this.navigator = navigator;
  }

  // 播放/暂停切换
  togglePlayPause(): void {
    if (!this.navigator) return;
    
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // 播放
  play(): void {
    if (!this.navigator) return;
    
    // 直接播放当前选中汉字的完整动画
    this.navigator.playAll();
    this.isPlaying = true;
  }

  // 暂停
  pause(): void {
    if (!this.navigator) return;
    
    this.navigator.pause();
    this.isPlaying = false;
  }

  // 获取当前状态
  getPlayStatus(): boolean {
    return this.isPlaying;
  }
}

// 全局控制器
const controller = new HanziController();
let currentNavigator: StrokeNavigator | null = null;
let navigators: StrokeNavigator[] = [];
let currentCharIndex: number = 0;

// 显示笔顺动画
function showStrokeOrder(text: string) {
  // 清除旧的
  container.innerHTML = '';
  strokeInfo.textContent = '加载中...';
  writers = [];
  navigators = [];
  currentNavigator = null;
  currentCharIndex = 0;
  
  // 分割成单个汉字
  const chars = text.trim().split('');
  
  if (chars.length === 0) {
    strokeInfo.textContent = '请输入汉字';
    return;
  }
  
  // 为每个汉字创建容器
  const charContainers = chars.map((char, index) => {
    // 创建主容器
    const mainContainer = document.createElement('div');
    mainContainer.style.width = '300px';
    mainContainer.style.height = '300px';
    mainContainer.style.background = '#fff';
    mainContainer.style.borderRadius = '12px';
    mainContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    mainContainer.style.display = 'flex';
    mainContainer.style.alignItems = 'center';
    mainContainer.style.justifyContent = 'center';
    mainContainer.style.position = 'relative';
    mainContainer.style.cursor = 'pointer';
    mainContainer.style.transition = 'border 0.3s ease';
    
    // 添加汉字标签
    const charLabel = document.createElement('div');
    charLabel.style.position = 'absolute';
    charLabel.style.top = '10px';
    charLabel.style.left = '10px';
    charLabel.style.fontSize = '14px';
    charLabel.style.color = '#666';
    charLabel.textContent = `第 ${index + 1} 个`;
    mainContainer.appendChild(charLabel);
    
    // 添加字符显示
    const charDisplay = document.createElement('div');
    charDisplay.style.position = 'absolute';
    charDisplay.style.top = '10px';
    charDisplay.style.right = '10px';
    charDisplay.style.fontSize = '18px';
    charDisplay.style.fontWeight = 'bold';
    charDisplay.style.color = '#333';
    charDisplay.textContent = char;
    mainContainer.appendChild(charDisplay);
    
    // 检查是否需要显示田字格
    let contentContainer: HTMLElement;
    if (gridToggle.checked) {
      // 创建带有田字格背景的 SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '280');
      svg.setAttribute('height', '280');
      svg.setAttribute('id', `char-svg-${index}`);
      
      // 绘制田字格
      // 外框
      const outerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      outerRect.setAttribute('x', '5');
      outerRect.setAttribute('y', '5');
      outerRect.setAttribute('width', '270');
      outerRect.setAttribute('height', '270');
      outerRect.setAttribute('stroke', '#ddd');
      outerRect.setAttribute('stroke-width', '2');
      outerRect.setAttribute('fill', 'none');
      svg.appendChild(outerRect);
      
      // 十字线
      const cross1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      cross1.setAttribute('x1', '140');
      cross1.setAttribute('y1', '5');
      cross1.setAttribute('x2', '140');
      cross1.setAttribute('y2', '275');
      cross1.setAttribute('stroke', '#ddd');
      cross1.setAttribute('stroke-width', '2');
      svg.appendChild(cross1);
      
      const cross2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      cross2.setAttribute('x1', '5');
      cross2.setAttribute('y1', '140');
      cross2.setAttribute('x2', '275');
      cross2.setAttribute('y2', '140');
      cross2.setAttribute('stroke', '#ddd');
      cross2.setAttribute('stroke-width', '2');
      svg.appendChild(cross2);
      
      mainContainer.appendChild(svg);
      contentContainer = svg;
    } else {
      // 创建普通 div 容器
      const innerDiv = document.createElement('div');
      innerDiv.style.width = '280px';
      innerDiv.style.height = '280px';
      mainContainer.appendChild(innerDiv);
      contentContainer = innerDiv;
    }
    
    // 无论是否显示田字格，都将容器添加到主容器中
    container.appendChild(mainContainer);
    
    // 为容器添加点击事件
    mainContainer.addEventListener('click', () => {
      // 清除所有容器的选中状态
      document.querySelectorAll('#characters-container > div').forEach((div) => {
        div.style.border = 'none';
      });
      
      // 设置当前容器为选中状态
      mainContainer.style.border = '2px solid #4a90d9';
      
      // 更新当前导航器
      currentNavigator = navigators[index];
      controller.setNavigator(currentNavigator);
      currentCharIndex = index;
      
      // 更新笔画计数器
      currentNavigator.updateStrokeCounter();
      
      // 更新状态信息
      strokeInfo.textContent = `当前控制：第 ${index + 1} 个汉字 "${char}"`;
    });
    
    return { mainContainer, contentContainer };
  });
  
  // 词组动画
  let currentIndex = 0;
  
  function animateNextChar() {
    if (currentIndex >= chars.length) {
      // 所有汉字显示完成
      strokeInfo.textContent = `共 ${chars.length} 个汉字`;
      
      // 默认选中第一个汉字
      if (chars.length > 0 && charContainers[0]) {
        charContainers[0].mainContainer.click();
      }
      
      return;
    }
    
    const char = chars[currentIndex];
    const { contentContainer } = charContainers[currentIndex];
    
    // 创建新的 writer
    const writer = HanziWriter.create(contentContainer, char, {
      width: 280,
      height: 280,
      padding: 10,
      showOutline: false, // 默认不显示轮廓
      showCharacter: true, // 直接显示完整汉字
      strokeColor: '#333',
      outlineColor: '#ddd',
      drawingColor: '#4a90d9'
    });
    
    // 确保隐藏轮廓
    writer.hideOutline();
    
    writers.push(writer);
    
    // 为每个汉字创建导航器
    const navigator = new StrokeNavigator(writer, char);
    navigators.push(navigator);
    
    // 为第一个汉字设置为当前导航器
    if (currentIndex === 0) {
      currentNavigator = navigator;
      controller.setNavigator(currentNavigator);
      currentCharIndex = 0;
    }
    
    // 获取字符数据以知道总笔画数
    writer.getCharacterData()
      .then((characterData) => {
        const totalStrokes = characterData.strokes.length || 0;
        strokeInfo.textContent = `显示第 ${currentIndex + 1}/${chars.length} 个汉字，笔画数：${totalStrokes}`;
      })
      .then(() => {
        // 直接处理下一个汉字，不播放动画
        currentIndex++;
        animateNextChar();
      })
      .catch((error) => {
        // 处理错误
        strokeInfo.textContent = '加载失败，请重试';
        console.error('Failed to load character:', error);
      });
  }
  
  // 开始第一个汉字的动画
  animateNextChar();
}

// 输入框失焦时自动刷新显示
charInput.addEventListener('blur', () => {
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

// 绑定控制按钮事件
prevBtn.addEventListener('click', () => {
  currentNavigator?.previousStroke();
});

playPauseBtn.addEventListener('click', () => {
  controller.togglePlayPause();
  playPauseBtn.textContent = controller.getPlayStatus() ? '⏸ 暂停' : '▶ 播放';
});

nextBtn.addEventListener('click', () => {
  currentNavigator?.nextStroke();
});

resetBtn.addEventListener('click', () => {
  currentNavigator?.reset();
});

playAllBtn.addEventListener('click', () => {
  if (navigators.length === 0) return;
  
  // 先隐藏所有汉字
  writers.forEach(writer => {
    writer.hideCharacter();
  });
  
  // 依次播放所有汉字的动画，使用动画链技术
  let currentPlayIndex = 0;
  
  function playNextChar() {
    if (currentPlayIndex >= navigators.length) {
      strokeInfo.textContent = '所有汉字播放完成';
      return;
    }
    
    const navigator = navigators[currentPlayIndex];
    const writer = writers[currentPlayIndex];
    strokeInfo.textContent = `正在播放第 ${currentPlayIndex + 1}/${navigators.length} 个汉字`;
    
    // 重置当前汉字
    navigator.reset();
    
    // 播放当前汉字的动画，使用 onComplete 回调来链式播放
    writer.animateCharacter({
      onComplete: () => {
        // 动画完成后，播放下一个汉字
        currentPlayIndex++;
        playNextChar();
      }
    });
  }
  
  // 开始播放第一个汉字
  playNextChar();
});

// 导出 SVG 笔画演示图片按钮事件
const exportSvgBtn = document.getElementById('export-svg-btn')!;
exportSvgBtn.addEventListener('click', async () => {
  const text = charInput.value.trim();
  if (!text) {
    alert('请先输入并显示汉字');
    return;
  }

  exportSvgBtn.disabled = true;
  exportSvgBtn.textContent = '生成中...';

  try {
    // 分割成单个汉字
    const chars = text.split('');
    
    // 创建一个容器来放置所有汉字的笔画图片
    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.flexDirection = 'column';
    mainContainer.style.gap = '20px';
    mainContainer.style.alignItems = 'center';
    
    // 渲染笔画演示图片
    function renderFanningStrokes(target, strokes, showTianZiGe) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '75');
      svg.setAttribute('height', '75');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.style.border = '1px solid #EEE';
      svg.style.marginRight = '3px';
      target.appendChild(svg);
      
      // 如果显示田字格，添加田字格
      if (showTianZiGe) {
        // 外框
        const outerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        outerRect.setAttribute('x', '2');
        outerRect.setAttribute('y', '2');
        outerRect.setAttribute('width', '71');
        outerRect.setAttribute('height', '71');
        outerRect.setAttribute('stroke', '#ddd');
        outerRect.setAttribute('stroke-width', '1');
        outerRect.setAttribute('fill', 'none');
        svg.appendChild(outerRect);
        
        // 十字线
        const cross1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cross1.setAttribute('x1', '37.5');
        cross1.setAttribute('y1', '2');
        cross1.setAttribute('x2', '37.5');
        cross1.setAttribute('y2', '73');
        cross1.setAttribute('stroke', '#ddd');
        cross1.setAttribute('stroke-width', '1');
        svg.appendChild(cross1);
        
        const cross2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cross2.setAttribute('x1', '2');
        cross2.setAttribute('y1', '37.5');
        cross2.setAttribute('x2', '73');
        cross2.setAttribute('y2', '37.5');
        cross2.setAttribute('stroke', '#ddd');
        cross2.setAttribute('stroke-width', '1');
        svg.appendChild(cross2);
      }
      
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // 设置变换属性，使汉字渲染为 75x75
      const transformData = HanziWriter.getScalingTransform(75, 75);
      group.setAttributeNS(null, 'transform', transformData.transform);
      svg.appendChild(group);
      
      strokes.forEach(function(strokePath) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttributeNS(null, 'd', strokePath);
        // 设置字符路径样式
        path.style.fill = '#555';
        group.appendChild(path);
      });
    }
    
    // 为每个汉字创建笔画演示
    const charDatas = [];
    let allDataLoaded = true;
    
    for (const char of chars) {
      try {
        const charData = await HanziWriter.loadCharacterData(char);
        charDatas.push(charData);
        
        // 创建一个容器来放置当前汉字的笔画图片
        const charContainer = document.createElement('div');
        charContainer.style.display = 'flex';
        charContainer.style.flexDirection = 'column';
        charContainer.style.alignItems = 'center';
        charContainer.style.gap = '10px';
        
        const charTitle = document.createElement('h4');
        charTitle.textContent = `${char} 的笔画演示`;
        charTitle.style.margin = '0';
        charContainer.appendChild(charTitle);
        
        // 创建一个容器来放置笔画图片
        const strokesContainer = document.createElement('div');
        strokesContainer.style.display = 'flex';
        strokesContainer.style.gap = '10px';
        strokesContainer.style.flexWrap = 'wrap';
        strokesContainer.style.justifyContent = 'center';
        strokesContainer.style.alignItems = 'center';
        
        // 为每一笔创建一个 SVG
        for (let i = 0; i < charData.strokes.length; i++) {
          const strokesPortion = charData.strokes.slice(0, i + 1);
          renderFanningStrokes(strokesContainer, strokesPortion, gridToggle.checked);
        }
        
        charContainer.appendChild(strokesContainer);
        mainContainer.appendChild(charContainer);
      } catch (error) {
        console.error(`加载字符 ${char} 数据失败:`, error);
        allDataLoaded = false;
        
        // 创建一个容器来显示错误信息
        const errorContainer = document.createElement('div');
        errorContainer.style.display = 'flex';
        errorContainer.style.flexDirection = 'column';
        errorContainer.style.alignItems = 'center';
        errorContainer.style.gap = '10px';
        
        const errorTitle = document.createElement('h4');
        errorTitle.textContent = `${char} 加载失败`;
        errorTitle.style.margin = '0';
        errorTitle.style.color = 'red';
        errorContainer.appendChild(errorTitle);
        
        const errorMessage = document.createElement('p');
        errorMessage.textContent = '无法加载该字符的笔画数据';
        errorMessage.style.margin = '0';
        errorContainer.appendChild(errorMessage);
        
        mainContainer.appendChild(errorContainer);
        
        // 为失败的字符添加一个占位符
        charDatas.push(null);
      }
    }
    
    // 创建一个临时容器来显示预览
    const previewContainer = document.createElement('div');
    previewContainer.style.position = 'fixed';
    previewContainer.style.top = '50%';
    previewContainer.style.left = '50%';
    previewContainer.style.transform = 'translate(-50%, -50%)';
    previewContainer.style.backgroundColor = 'white';
    previewContainer.style.padding = '20px';
    previewContainer.style.borderRadius = '12px';
    previewContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    previewContainer.style.zIndex = '1000';
    previewContainer.style.maxWidth = '90vw';
    previewContainer.style.maxHeight = '80vh';
    previewContainer.style.overflow = 'auto';
    
    const title = document.createElement('h3');
    title.textContent = '笔画演示';
    title.style.textAlign = 'center';
    title.style.marginTop = '0';
    previewContainer.appendChild(title);
    
    previewContainer.appendChild(mainContainer);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.gap = '10px';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '下载所有 SVG';
    downloadBtn.style.padding = '8px 16px';
    downloadBtn.style.backgroundColor = '#4a90d9';
    downloadBtn.style.color = 'white';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '4px';
    downloadBtn.style.cursor = 'pointer';
    
    downloadBtn.addEventListener('click', async () => {
      try {
        // 为每个汉字创建并下载 SVG
        let successCount = 0;
        for (let i = 0; i < chars.length; i++) {
          const char = chars[i];
          const charData = charDatas[i];
          
          if (!charData) {
            console.warn(`跳过字符 ${char}，因为数据加载失败`);
            continue;
          }
          
          try {
            const totalStrokes = charData.strokes.length;
            
            // 创建一个包含所有笔画的 SVG
            const fullSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            fullSvg.setAttribute('width', `${totalStrokes * 85}`);
            fullSvg.setAttribute('height', '90');
            fullSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            
            // 添加所有笔画图片
            for (let j = 0; j < totalStrokes; j++) {
              const strokesPortion = charData.strokes.slice(0, j + 1);
              
              const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              svg.setAttribute('width', '75');
              svg.setAttribute('height', '75');
              svg.setAttribute('x', `${j * 85}`);
              svg.setAttribute('y', '10');
              
              // 如果显示田字格，添加田字格
              if (gridToggle.checked) {
                // 外框
                const outerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                outerRect.setAttribute('x', '2');
                outerRect.setAttribute('y', '2');
                outerRect.setAttribute('width', '71');
                outerRect.setAttribute('height', '71');
                outerRect.setAttribute('stroke', '#ddd');
                outerRect.setAttribute('stroke-width', '1');
                outerRect.setAttribute('fill', 'none');
                svg.appendChild(outerRect);
                
                // 十字线
                const cross1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                cross1.setAttribute('x1', '37.5');
                cross1.setAttribute('y1', '2');
                cross1.setAttribute('x2', '37.5');
                cross1.setAttribute('y2', '73');
                cross1.setAttribute('stroke', '#ddd');
                cross1.setAttribute('stroke-width', '1');
                svg.appendChild(cross1);
                
                const cross2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                cross2.setAttribute('x1', '2');
                cross2.setAttribute('y1', '37.5');
                cross2.setAttribute('x2', '73');
                cross2.setAttribute('y2', '37.5');
                cross2.setAttribute('stroke', '#ddd');
                cross2.setAttribute('stroke-width', '1');
                svg.appendChild(cross2);
              }
              
              const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              
              // 设置变换属性，使汉字渲染为 75x75
              const transformData = HanziWriter.getScalingTransform(75, 75);
              group.setAttributeNS(null, 'transform', transformData.transform);
              svg.appendChild(group);
              
              strokesPortion.forEach(function(strokePath) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttributeNS(null, 'd', strokePath);
                // 设置字符路径样式
                path.style.fill = '#555';
                group.appendChild(path);
              });
              
              fullSvg.appendChild(svg);
            }
            
            // 转换为 SVG 字符串
            const svgString = new XMLSerializer().serializeToString(fullSvg);
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            // 创建下载链接
            const a = document.createElement('a');
            a.href = url;
            a.download = `${char}_笔画演示.svg`;
            a.click();
            
            // 清理
            URL.revokeObjectURL(url);
            
            successCount++;
            
            // 延迟一下，避免浏览器阻止多个下载
            if (i < chars.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error(`导出字符 ${char} 失败:`, error);
          }
        }
        
        if (successCount > 0) {
          alert(`成功导出 ${successCount} 个文件`);
        } else {
          alert('没有成功导出任何文件');
        }
      } catch (error) {
        console.error('下载过程中出错:', error);
        alert('下载过程中出错，请重试');
      }
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.padding = '8px 16px';
    closeBtn.style.backgroundColor = '#666';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(previewContainer);
    });
    
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(closeBtn);
    previewContainer.appendChild(buttonContainer);
    
    document.body.appendChild(previewContainer);
  } catch (err) {
    console.error('导出失败:', err);
    alert('导出失败，请重试');
  } finally {
    exportSvgBtn.disabled = false;
    exportSvgBtn.textContent = '导出笔画演示';
  }
});

// 田字格切换事件
gridToggle.addEventListener('change', () => {
  // 当田字格设置改变时，重新显示当前汉字
  const currentText = charInput.value.trim() || '人';
  showStrokeOrder(currentText);
});

// 页面加载完成后，默认创建一个文字容器
window.addEventListener('DOMContentLoaded', () => {
  // 默认显示"人"字
  showStrokeOrder('人');
  // 设置输入框默认值
  charInput.value = '人';
});
