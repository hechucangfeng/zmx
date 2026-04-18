/**
 * HanziWriter 播放控制集成示例
 * 展示如何在项目中集成播放/暂停和笔画控制功能
 */

import HanziWriter from 'hanzi-writer';
import { HanziWriterController, HanziWriterUI } from './hanzi-controller';

/**
 * 示例 1: 基础使用
 */
export function basicExample() {
  // 创建 HanziWriter 实例
  const writer = HanziWriter.create('character-container', '我', {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true,
    showCharacter: false,
    strokeAnimationSpeed: 2
  });

  // 创建控制器
  const controller = new HanziWriterController(writer, '我');

  // 绑定按钮
  document.getElementById('next-btn')?.addEventListener('click', () => {
    controller.nextStroke();
  });

  document.getElementById('prev-btn')?.addEventListener('click', () => {
    controller.previousStroke();
  });

  document.getElementById('play-btn')?.addEventListener('click', () => {
    controller.togglePlayPause();
  });

  document.getElementById('reset-btn')?.addEventListener('click', () => {
    controller.reset();
  });

  // 监听状态变化
  controller.onStrokeChange((index, total) => {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = `第 ${index + 1} / ${total} 笔`;
    }
  });

  return controller;
}

/**
 * 示例 2: 使用 UI 辅助类
 */
export function uiIntegrationExample() {
  // 创建 HanziWriter 实例
  const writer = HanziWriter.create('character-container', '中', {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true
  });

  // 创建控制器
  const controller = new HanziWriterController(writer, '中');

  // 创建 UI 管理器
  const ui = new HanziWriterUI(controller);

  // 注册 UI 元素
  ui.registerElements({
    prevBtn: '#prev-btn',
    playBtn: '#play-btn',
    nextBtn: '#next-btn',
    resetBtn: '#reset-btn',
    statusDisplay: '#status'
  });

  return { controller, ui };
}

/**
 * 示例 3: 多字符展示
 */
export function multiCharacterExample() {
  const characters = ['好', '好', '学', '习'];
  const controllers: HanziWriterController[] = [];

  characters.forEach((char, index) => {
    const container = document.createElement('div');
    container.id = `char-${index}`;
    container.style.display = 'inline-block';
    container.style.marginRight = '20px';
    document.getElementById('characters-container')?.appendChild(container);

    // 创建 writer
    const writer = HanziWriter.create(`char-${index}`, char, {
      width: 200,
      height: 200,
      padding: 15,
      showOutline: true
    });

    // 创建控制器
    const controller = new HanziWriterController(writer, char);
    controllers.push(controller);

    // 为每个字符添加控制按钮
    const controlsDiv = document.createElement('div');
    controlsDiv.style.marginTop = '10px';
    controlsDiv.style.textAlign = 'center';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀';
    prevBtn.addEventListener('click', () => controller.previousStroke());

    const playBtn = document.createElement('button');
    playBtn.textContent = '▶';
    playBtn.addEventListener('click', () => controller.togglePlayPause());

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '▶▶';
    nextBtn.addEventListener('click', () => controller.nextStroke());

    controlsDiv.appendChild(prevBtn);
    controlsDiv.appendChild(playBtn);
    controlsDiv.appendChild(nextBtn);

    container.appendChild(controlsDiv);
  });

  return controllers;
}

/**
 * 示例 4: 键盘快捷键支持
 */
export function keyboardShortcutsExample() {
  const writer = HanziWriter.create('character-container', '学', {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true
  });

  const controller = new HanziWriterController(writer, '学');

  // 键盘事件
  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        controller.previousStroke();
        break;
      case 'ArrowRight':
        event.preventDefault();
        controller.nextStroke();
        break;
      case ' ':
        event.preventDefault();
        controller.togglePlayPause();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        controller.reset();
        break;
    }
  });

  console.log('✓ 键盘快捷键已启用:');
  console.log('  ← → : 上一笔 / 下一笔');
  console.log('  SPACE : 播放 / 暂停');
  console.log('  R : 重置');

  return controller;
}

/**
 * 示例 5: 与现有 mainview/index.ts 集成
 */
export function integrateWithMainview(character: string) {
  // 假设已有一个 div 容器
  const container = document.getElementById('character-target-div');
  if (!container) {
    console.error('容器不存在');
    return;
  }

  // 创建 writer
  const writer = HanziWriter.create(container, character, {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true,
    showCharacter: false,
    strokeAnimationSpeed: 2
  });

  // 创建控制器
  const controller = new HanziWriterController(writer, character);

  // 创建控制面板
  const controlsPanel = document.createElement('div');
  controlsPanel.style.marginTop = '20px';
  controlsPanel.style.display = 'flex';
  controlsPanel.style.gap = '10px';
  controlsPanel.style.justifyContent = 'center';

  const buttons = {
    prev: document.createElement('button'),
    play: document.createElement('button'),
    next: document.createElement('button'),
    reset: document.createElement('button')
  };

  buttons.prev.textContent = '◀ 上一笔';
  buttons.play.textContent = '▶ 播放';
  buttons.next.textContent = '下一笔 ▶';
  buttons.reset.textContent = '重置';

  // 绑定事件
  buttons.prev.addEventListener('click', () => controller.previousStroke());
  buttons.play.addEventListener('click', () => controller.togglePlayPause());
  buttons.next.addEventListener('click', () => controller.nextStroke());
  buttons.reset.addEventListener('click', () => controller.reset());

  // 添加样式
  Object.values(buttons).forEach(btn => {
    btn.style.padding = '8px 16px';
    btn.style.fontSize = '14px';
    btn.style.cursor = 'pointer';
    btn.style.borderRadius = '4px';
    btn.style.border = '1px solid #ddd';
    btn.style.backgroundColor = '#fff';
    btn.style.transition = 'all 0.3s ease';

    btn.addEventListener('mouseover', () => {
      btn.style.backgroundColor = '#f0f0f0';
    });

    btn.addEventListener('mouseout', () => {
      btn.style.backgroundColor = '#fff';
    });

    controlsPanel.appendChild(btn);
  });

  // 添加状态显示
  const statusDisplay = document.createElement('div');
  statusDisplay.style.marginTop = '15px';
  statusDisplay.style.textAlign = 'center';
  statusDisplay.style.fontSize = '16px';
  statusDisplay.style.fontWeight = 'bold';
  statusDisplay.style.color = '#333';

  controller.onStrokeChange((index, total) => {
    statusDisplay.textContent = `第 ${index + 1} / ${total} 笔`;
  });

  controller.onPlayStatusChange((isPlaying) => {
    buttons.play.textContent = isPlaying ? '⏸ 暂停' : '▶ 播放';
    buttons.play.style.backgroundColor = isPlaying ? '#e8f5e9' : '#fff';
  });

  // 添加到 DOM
  container.parentElement?.appendChild(controlsPanel);
  container.parentElement?.appendChild(statusDisplay);

  return { controller, buttons, statusDisplay };
}

/**
 * 示例 6: 带进度条的完整 UI
 */
export function advancedUIExample() {
  const character = '练';
  const container = document.getElementById('character-container');
  if (!container) return;

  // 创建 writer
  const writer = HanziWriter.create(container, character, {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true,
    strokeAnimationSpeed: 2
  });

  const controller = new HanziWriterController(writer, character);

  // 创建完整 UI
  const ui = document.createElement('div');
  ui.style.marginTop = '30px';
  ui.style.padding = '20px';
  ui.style.backgroundColor = '#f5f5f5';
  ui.style.borderRadius = '8px';

  // 状态显示
  const status = document.createElement('div');
  status.style.fontSize = '18px';
  status.style.fontWeight = 'bold';
  status.style.marginBottom = '15px';
  ui.appendChild(status);

  // 进度条
  const progressBar = document.createElement('div');
  progressBar.style.width = '100%';
  progressBar.style.height = '20px';
  progressBar.style.backgroundColor = '#ddd';
  progressBar.style.borderRadius = '10px';
  progressBar.style.overflow = 'hidden';
  progressBar.style.marginBottom = '15px';

  const progressFill = document.createElement('div');
  progressFill.style.height = '100%';
  progressFill.style.backgroundColor = '#4CAF50';
  progressFill.style.transition = 'width 0.3s ease';
  progressFill.style.width = '0%';
  progressBar.appendChild(progressFill);
  ui.appendChild(progressBar);

  // 按钮组
  const buttonGroup = document.createElement('div');
  buttonGroup.style.display = 'flex';
  buttonGroup.style.gap = '10px';
  buttonGroup.style.justifyContent = 'center';

  const buttons = {
    prev: document.createElement('button'),
    play: document.createElement('button'),
    next: document.createElement('button'),
    reset: document.createElement('button')
  };

  buttons.prev.textContent = '◀ 上一笔';
  buttons.play.textContent = '▶ 播放';
  buttons.next.textContent = '下一笔 ▶';
  buttons.reset.textContent = '❌ 重置';

  // 统一按钮样式
  Object.values(buttons).forEach(btn => {
    btn.style.padding = '10px 20px';
    btn.style.fontSize = '14px';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
    btn.style.borderRadius = '4px';
    btn.style.border = 'none';
    btn.style.backgroundColor = '#2196F3';
    btn.style.color = 'white';
    btn.style.transition = 'all 0.3s ease';

    btn.addEventListener('mouseover', () => {
      btn.style.backgroundColor = '#1976D2';
      btn.style.transform = 'scale(1.05)';
    });

    btn.addEventListener('mouseout', () => {
      btn.style.backgroundColor = '#2196F3';
      btn.style.transform = 'scale(1)';
    });

    buttonGroup.appendChild(btn);
  });

  ui.appendChild(buttonGroup);
  container.parentElement?.appendChild(ui);

  // 绑定事件
  buttons.prev.addEventListener('click', () => controller.previousStroke());
  buttons.play.addEventListener('click', () => controller.togglePlayPause());
  buttons.next.addEventListener('click', () => controller.nextStroke());
  buttons.reset.addEventListener('click', () => controller.reset());

  // 状态监听
  controller.onStrokeChange((index, total) => {
    status.textContent = `第 ${index + 1} / ${total} 笔`;
    const percentage = ((index + 1) / total) * 100;
    progressFill.style.width = percentage + '%';
  });

  controller.onPlayStatusChange((isPlaying) => {
    buttons.play.textContent = isPlaying ? '⏸ 暂停' : '▶ 播放';
  });

  return controller;
}
