import HanziWriter from 'hanzi-writer';
import { HanziWriterController, HanziWriterUI } from './hanzi-controller';

type CharDataLoader = (char: string) => Promise<any>;

export function basicExample(charDataLoader: CharDataLoader) {
  const writer = HanziWriter.create('character-container', '我', {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true,
    showCharacter: false,
    strokeAnimationSpeed: 2,
    charDataLoader: (char: string, onLoad: (data: any) => void, onError: (err?: any) => void) => {
      charDataLoader(char).then(onLoad).catch(onError);
    }
  });

  const controller = new HanziWriterController(writer, '我', charDataLoader);

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

  controller.onStrokeChange((index, total) => {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = `第 ${index + 1} / ${total} 笔`;
    }
  });

  return controller;
}

export function uiIntegrationExample(charDataLoader: CharDataLoader) {
  const writer = HanziWriter.create('character-container', '中', {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true,
    charDataLoader: (char: string, onLoad: (data: any) => void, onError: (err?: any) => void) => {
      charDataLoader(char).then(onLoad).catch(onError);
    }
  });

  const controller = new HanziWriterController(writer, '中', charDataLoader);

  const ui = new HanziWriterUI(controller);

  ui.registerElements({
    prevBtn: '#prev-btn',
    playBtn: '#play-btn',
    nextBtn: '#next-btn',
    resetBtn: '#reset-btn',
    statusDisplay: '#status'
  });

  return { controller, ui };
}

export function multiCharacterExample(charDataLoader: CharDataLoader) {
  const characters = ['好', '好', '学', '习'];
  const controllers: HanziWriterController[] = [];

  characters.forEach((char, index) => {
    const container = document.createElement('div');
    container.id = `char-${index}`;
    container.style.display = 'inline-block';
    container.style.marginRight = '20px';
    document.getElementById('characters-container')?.appendChild(container);

    const writer = HanziWriter.create(`char-${index}`, char, {
      width: 200,
      height: 200,
      padding: 15,
      showOutline: true,
      charDataLoader: (c: string, onLoad: (data: any) => void, onError: (err?: any) => void) => {
        charDataLoader(c).then(onLoad).catch(onError);
      }
    });

    const controller = new HanziWriterController(writer, char, charDataLoader);
    controllers.push(controller);

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

export function keyboardShortcutsExample(charDataLoader: CharDataLoader) {
  const writer = HanziWriter.create('character-container', '学', {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true,
    charDataLoader: (char: string, onLoad: (data: any) => void, onError: (err?: any) => void) => {
      charDataLoader(char).then(onLoad).catch(onError);
    }
  });

  const controller = new HanziWriterController(writer, '学', charDataLoader);

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

export function integrateWithMainview(character: string, charDataLoader: CharDataLoader) {
  const container = document.getElementById('character-target-div');
  if (!container) {
    console.error('容器不存在');
    return;
  }

  const writer = HanziWriter.create(container, character, {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true,
    showCharacter: false,
    strokeAnimationSpeed: 2,
    charDataLoader: (char: string, onLoad: (data: any) => void, onError: (err?: any) => void) => {
      charDataLoader(char).then(onLoad).catch(onError);
    }
  });

  const controller = new HanziWriterController(writer, character, charDataLoader);

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

  buttons.prev.addEventListener('click', () => controller.previousStroke());
  buttons.play.addEventListener('click', () => controller.togglePlayPause());
  buttons.next.addEventListener('click', () => controller.nextStroke());
  buttons.reset.addEventListener('click', () => controller.reset());

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

  container.parentElement?.appendChild(controlsPanel);
  container.parentElement?.appendChild(statusDisplay);

  return { controller, buttons, statusDisplay };
}

export function advancedUIExample(charDataLoader: CharDataLoader) {
  const character = '练';
  const container = document.getElementById('character-container');
  if (!container) return;

  const writer = HanziWriter.create(container, character, {
    width: 300,
    height: 300,
    padding: 20,
    showOutline: true,
    strokeAnimationSpeed: 2,
    charDataLoader: (char: string, onLoad: (data: any) => void, onError: (err?: any) => void) => {
      charDataLoader(char).then(onLoad).catch(onError);
    }
  });

  const controller = new HanziWriterController(writer, character, charDataLoader);

  const ui = document.createElement('div');
  ui.style.marginTop = '30px';
  ui.style.padding = '20px';
  ui.style.backgroundColor = '#f5f5f5';
  ui.style.borderRadius = '8px';

  const status = document.createElement('div');
  status.style.fontSize = '18px';
  status.style.fontWeight = 'bold';
  status.style.marginBottom = '15px';
  ui.appendChild(status);

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

  buttons.prev.addEventListener('click', () => controller.previousStroke());
  buttons.play.addEventListener('click', () => controller.togglePlayPause());
  buttons.next.addEventListener('click', () => controller.nextStroke());
  buttons.reset.addEventListener('click', () => controller.reset());

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
