/**
 * HanziWriter 播放控制和笔画导航实现
 * 支持：播放/暂停、上一笔、下一笔、跳转笔画
 */

import HanziWriter from 'hanzi-writer';

/**
 * 笔画导航和播放控制类
 */
export class HanziWriterController {
  private writer: HanziWriter;
  private character: string;
  private currentStrokeIndex: number = 0;
  private totalStrokes: number = 0;
  private charData: any = null;
  private isAnimating: boolean = false;
  private isPlaying: boolean = false;
  private playbackTimeout: NodeJS.Timeout | null = null;

  // 回调函数
  private onStrokeChangeCallback?: (index: number, total: number) => void;
  private onPlayStatusChangeCallback?: (isPlaying: boolean) => void;

  constructor(writer: HanziWriter, character: string) {
    this.writer = writer;
    this.character = character;
    this.initializeCharacterData();
  }

  /**
   * 初始化字符数据
   */
  private async initializeCharacterData(): Promise<void> {
    try {
      this.charData = await HanziWriter.loadCharacterData(this.character);
      this.totalStrokes = this.charData.strokes.length;
      console.log(`✓ 字符 "${this.character}" 加载完成，共 ${this.totalStrokes} 笔`);
      this.notifyStrokeChange();
    } catch (error) {
      console.error(`✗ 加载字符数据失败: ${error}`);
    }
  }

  /**
   * 获取总笔画数
   */
  getTotalStrokes(): number {
    return this.totalStrokes;
  }

  /**
   * 获取当前笔画索引 (0-based)
   */
  getCurrentStrokeIndex(): number {
    return this.currentStrokeIndex;
  }

  /**
   * 获取当前笔画编号 (1-based，用于显示)
   */
  getCurrentStrokeNumber(): number {
    return this.currentStrokeIndex + 1;
  }

  /**
   * 获取状态信息字符串
   */
  getStatusInfo(): string {
    return `第 ${this.getCurrentStrokeNumber()} / ${this.totalStrokes} 笔`;
  }

  /**
   * 播放 / 暂停切换
   */
  togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * 播放（继续）
   */
  play(): void {
    if (this.isPlaying || this.isAnimating) return;

    this.isPlaying = true;
    this.notifyPlayStatusChange();

    // 如果在最后一笔或还没有开始，重新开始
    if (this.currentStrokeIndex >= this.totalStrokes - 1) {
      this.reset();
    }

    this.playFromCurrent();
  }

  /**
   * 暂停
   */
  pause(): void {
    this.writer.pauseAnimation();
    this.isPlaying = false;
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
    this.notifyPlayStatusChange();
  }

  /**
   * 获取播放状态
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 播放下一笔
   */
  nextStroke(): void {
    if (this.isAnimating || this.isPlaying) return;

    if (this.currentStrokeIndex < this.totalStrokes - 1) {
      this.currentStrokeIndex++;
      this.playCurrentStroke();
    } else {
      console.warn('⚠ 已经是最后一笔');
    }
  }

  /**
   * 播放上一笔
   */
  previousStroke(): void {
    if (this.isAnimating || this.isPlaying) return;

    if (this.currentStrokeIndex > 0) {
      this.currentStrokeIndex--;
      this.rewindToCurrentStroke();
    } else {
      console.warn('⚠ 已经是第一笔');
    }
  }

  /**
   * 跳转到指定笔画
   */
  goToStroke(strokeIndex: number): void {
    if (this.isAnimating || this.isPlaying) return;

    // 转换为 0-based index
    const index = strokeIndex - 1;

    if (index < 0 || index >= this.totalStrokes) {
      console.error(`✗ 笔画索引 ${strokeIndex} 超出范围 (1-${this.totalStrokes})`);
      return;
    }

    this.currentStrokeIndex = index;
    this.rewindToCurrentStroke();
  }

  /**
   * 重置为初始状态
   */
  reset(): void {
    this.pause();
    this.currentStrokeIndex = 0;
    this.writer.hideCharacter();
    this.notifyStrokeChange();
  }

  /**
   * 重新开始 (从头开始播放)
   */
  restart(): void {
    this.reset();
    this.play();
  }

  /**
   * 私有方法：播放当前笔画
   */
  private playCurrentStroke(): void {
    if (this.currentStrokeIndex >= this.totalStrokes) {
      return;
    }

    this.isAnimating = true;

    // 显示当前笔画及其之前的所有笔画
    const displayStrokes = this.currentStrokeIndex + 1;

    // 清除旧的动画
    this.writer.hideCharacter();

    // 从第一笔开始逐笔播放到当前笔画
    this.animateStrokesSequentially(0, displayStrokes);
  }

  /**
   * 私有方法：倒带到当前笔画
   */
  private rewindToCurrentStroke(): void {
    this.pause();
    this.playCurrentStroke();
  }

  /**
   * 私有方法：连续播放笔画序列
   */
  private animateStrokesSequentially(
    startIndex: number,
    endIndex: number
  ): void {
    if (startIndex >= endIndex) {
      this.isAnimating = false;
      this.notifyStrokeChange();

      // 如果在播放状态，继续下一笔
      if (this.isPlaying && this.currentStrokeIndex < this.totalStrokes - 1) {
        this.currentStrokeIndex++;
        this.playbackTimeout = setTimeout(() => {
          this.playCurrentStroke();
        }, 100); // 笔画间隔
      } else if (this.isPlaying && this.currentStrokeIndex >= this.totalStrokes - 1) {
        this.isPlaying = false;
        this.notifyPlayStatusChange();
      }

      return;
    }

    this.writer.animateStroke(startIndex, {
      onComplete: () => {
        this.animateStrokesSequentially(startIndex + 1, endIndex);
      }
    });
  }

  /**
   * 私有方法：从当前位置播放
   */
  private playFromCurrent(): void {
    if (this.currentStrokeIndex >= this.totalStrokes) {
      this.isPlaying = false;
      return;
    }

    // 显示到当前笔画为止
    this.playCurrentStroke();
  }

  /**
   * 订阅笔画变化事件
   */
  onStrokeChange(callback: (index: number, total: number) => void): void {
    this.onStrokeChangeCallback = callback;
  }

  /**
   * 订阅播放状态变化事件
   */
  onPlayStatusChange(callback: (isPlaying: boolean) => void): void {
    this.onPlayStatusChangeCallback = callback;
  }

  /**
   * 私有方法：通知笔画变化
   */
  private notifyStrokeChange(): void {
    if (this.onStrokeChangeCallback) {
      this.onStrokeChangeCallback(this.currentStrokeIndex, this.totalStrokes);
    }
  }

  /**
   * 私有方法：通知播放状态变化
   */
  private notifyPlayStatusChange(): void {
    if (this.onPlayStatusChangeCallback) {
      this.onPlayStatusChangeCallback(this.isPlaying);
    }
  }
}

/**
 * UI 集成辅助函数
 */
export class HanziWriterUI {
  private controller: HanziWriterController;
  private elements: {
    prevBtn?: HTMLButtonElement;
    playBtn?: HTMLButtonElement;
    nextBtn?: HTMLButtonElement;
    resetBtn?: HTMLButtonElement;
    statusDisplay?: HTMLElement;
  } = {};

  constructor(controller: HanziWriterController) {
    this.controller = controller;
    this.setupEventListeners();
    this.controller.onStrokeChange(() => this.updateDisplay());
    this.controller.onPlayStatusChange(() => this.updatePlayButton());
  }

  /**
   * 注册 UI 元素
   */
  registerElements(selectors: {
    prevBtn?: string;
    playBtn?: string;
    nextBtn?: string;
    resetBtn?: string;
    statusDisplay?: string;
  }): void {
    if (selectors.prevBtn) {
      this.elements.prevBtn = document.querySelector(selectors.prevBtn) as HTMLButtonElement;
    }
    if (selectors.playBtn) {
      this.elements.playBtn = document.querySelector(selectors.playBtn) as HTMLButtonElement;
    }
    if (selectors.nextBtn) {
      this.elements.nextBtn = document.querySelector(selectors.nextBtn) as HTMLButtonElement;
    }
    if (selectors.resetBtn) {
      this.elements.resetBtn = document.querySelector(selectors.resetBtn) as HTMLButtonElement;
    }
    if (selectors.statusDisplay) {
      this.elements.statusDisplay = document.querySelector(selectors.statusDisplay) as HTMLElement;
    }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 前进按钮
    this.elements.nextBtn?.addEventListener('click', () => {
      this.controller.nextStroke();
    });

    // 播放/暂停按钮
    this.elements.playBtn?.addEventListener('click', () => {
      this.controller.togglePlayPause();
    });

    // 后退按钮
    this.elements.prevBtn?.addEventListener('click', () => {
      this.controller.previousStroke();
    });

    // 重置按钮
    this.elements.resetBtn?.addEventListener('click', () => {
      this.controller.reset();
    });
  }

  /**
   * 更新显示
   */
  private updateDisplay(): void {
    if (this.elements.statusDisplay) {
      this.elements.statusDisplay.textContent = this.controller.getStatusInfo();
    }

    // 更新按钮禁用状态
    const isFirst = this.controller.getCurrentStrokeIndex() === 0;
    const isLast = this.controller.getCurrentStrokeIndex() === this.controller.getTotalStrokes() - 1;

    if (this.elements.prevBtn) {
      this.elements.prevBtn.disabled = isFirst;
    }
    if (this.elements.nextBtn) {
      this.elements.nextBtn.disabled = isLast;
    }
  }

  /**
   * 更新播放按钮
   */
  private updatePlayButton(): void {
    if (this.elements.playBtn) {
      const isPlaying = this.controller.isCurrentlyPlaying();
      this.elements.playBtn.textContent = isPlaying ? '⏸ 暂停' : '▶ 播放';
      this.elements.playBtn.classList.toggle('playing', isPlaying);
    }
  }
}
