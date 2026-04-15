import { setIcon } from 'obsidian';
import type { ImageViewerSettings } from '../types';

export interface ToolbarCallbacks {
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onToggleGallery: () => void;
  onToggleInfo: () => void;
  onToggleSlideshow: () => void;
  onSettings: () => void;
  onClose: () => void;
}

export class Toolbar {
  private container: HTMLElement;
  private settings: ImageViewerSettings;
  private callbacks: ToolbarCallbacks;
  private counterEl: HTMLElement;
  private zoomEl: HTMLElement;
  private slideshowBtn: HTMLElement;
  private isPlaying: boolean = false;

  constructor(
    container: HTMLElement,
    settings: ImageViewerSettings,
    callbacks: ToolbarCallbacks
  ) {
    this.container = container;
    this.settings = settings;
    this.callbacks = callbacks;
    this.counterEl = document.createElement('span');
    this.zoomEl = document.createElement('span');
    this.slideshowBtn = document.createElement('button');
    this.render();
  }

  private render(): void {
    this.container.addClass('image-viewer-toolbar');
    this.container.empty();

    // Left section - Navigation
    const leftSection = this.container.createDiv({ cls: 'toolbar-section' });
    this.addButton(leftSection, 'chevron-left', 'Previous (←)', this.callbacks.onPrev);
    this.addButton(leftSection, 'chevron-right', 'Next (→)', this.callbacks.onNext);

    // Counter
    this.counterEl.className = 'toolbar-counter';
    leftSection.appendChild(this.counterEl);

    // Center section - Zoom
    const centerSection = this.container.createDiv({ cls: 'toolbar-section' });
    this.addButton(centerSection, 'minus', 'Zoom Out (-)', this.callbacks.onZoomOut);
    this.zoomEl.className = 'toolbar-zoom';
    centerSection.appendChild(this.zoomEl);
    this.addButton(centerSection, 'plus', 'Zoom In (+)', this.callbacks.onZoomIn);

    // Right section - Actions
    const rightSection = this.container.createDiv({ cls: 'toolbar-section' });
    this.addButton(rightSection, 'rotate-ccw', 'Rotate CCW (S)', this.callbacks.onRotateCCW);
    this.addButton(rightSection, 'rotate-cw', 'Rotate CW (W)', this.callbacks.onRotateCW);
    this.addButton(rightSection, 'grid', 'Gallery (G)', this.callbacks.onToggleGallery);
    this.addButton(rightSection, 'info', 'Info (I)', this.callbacks.onToggleInfo);

    this.slideshowBtn = this.addButton(
      rightSection,
      'play',
      'Slideshow (F5)',
      this.callbacks.onToggleSlideshow
    );

    this.addButton(rightSection, 'settings', 'Settings (F4)', this.callbacks.onSettings);
    this.addButton(rightSection, 'x', 'Close (Esc)', this.callbacks.onClose);
  }

  private addButton(
    container: HTMLElement,
    icon: string,
    tooltip: string,
    callback: () => void
  ): HTMLElement {
    const btn = container.createEl('button', { cls: 'toolbar-btn' });
    setIcon(btn, icon);
    btn.setAttribute('aria-label', tooltip);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      callback();
    });
    return btn;
  }

  updateSettings(settings: ImageViewerSettings): void {
    this.settings = settings;
  }

  setCounter(current: number, total: number): void {
    this.counterEl.textContent = `${current} / ${total}`;
  }

  setZoom(percentage: number): void {
    this.zoomEl.textContent = `${percentage}%`;
  }

  setSlideshowPlaying(playing: boolean): void {
    this.isPlaying = playing;
    setIcon(this.slideshowBtn, playing ? 'pause' : 'play');
  }

  setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'flex' : 'none';
  }

  destroy(): void {
    this.container.empty();
  }
}
