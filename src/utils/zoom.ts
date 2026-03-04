import type { ZoomState, ImageViewerSettings } from '../types';

export class ZoomManager {
  private settings: ImageViewerSettings;
  private state: ZoomState;
  private defaultScale: number = 1;
  private imageWidth: number = 0;
  private imageHeight: number = 0;
  private containerWidth: number = 0;
  private containerHeight: number = 0;

  constructor(settings: ImageViewerSettings) {
    this.settings = settings;
    this.state = {
      scale: 1,
      translateX: 0,
      translateY: 0
    };
  }

  updateSettings(settings: ImageViewerSettings): void {
    this.settings = settings;
  }

  setImageDimensions(width: number, height: number): void {
    this.imageWidth = width;
    this.imageHeight = height;
  }

  setContainerDimensions(width: number, height: number): void {
    this.containerWidth = width;
    this.containerHeight = height;
  }

  getState(): ZoomState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      scale: 1,
      translateX: 0,
      translateY: 0
    };
    this.applyDefaultZoom();
  }

  applyDefaultZoom(): ZoomState {
    if (this.imageWidth === 0 || this.imageHeight === 0) {
      return this.state;
    }

    // CSS 已经通过 max-width: 100%; max-height: 100%; object-fit: contain
    // 处理了图片尺寸适应，所以 JS 的 scale 始终为 1
    // scale 只在用户手动缩放时才改变
    this.state.scale = 1;
    this.defaultScale = 1;
    this.centerImage();

    return this.state;
  }

  private centerImage(): void {
    this.state.translateX = 0;
    this.state.translateY = 0;
  }

  zoomIn(cursorX?: number, cursorY?: number): ZoomState {
    return this.zoom(this.settings.zoomStep, cursorX, cursorY);
  }

  zoomOut(cursorX?: number, cursorY?: number): ZoomState {
    return this.zoom(-this.settings.zoomStep, cursorX, cursorY);
  }

  private zoom(delta: number, cursorX?: number, cursorY?: number): ZoomState {
    const oldScale = this.state.scale;
    const newScale = Math.max(0.1, Math.min(10, this.state.scale + delta));
    this.state.scale = newScale;

    if (cursorX !== undefined && cursorY !== undefined && this.containerWidth > 0 && this.containerHeight > 0) {
      const scaleRatio = newScale / oldScale;
      const centerX = this.containerWidth / 2;
      const centerY = this.containerHeight / 2;
      this.state.translateX = (cursorX - centerX) * (1 - scaleRatio) + this.state.translateX * scaleRatio;
      this.state.translateY = (cursorY - centerY) * (1 - scaleRatio) + this.state.translateY * scaleRatio;
    } else {
      this.centerImage();
    }

    return this.state;
  }

  pan(deltaX: number, deltaY: number): ZoomState {
    this.state.translateX += deltaX;
    this.state.translateY += deltaY;
    return this.state;
  }

  setScale(scale: number): ZoomState {
    this.state.scale = Math.max(0.1, Math.min(10, scale));
    return this.state;
  }

  recenter(): void {
    if (this.imageWidth > 0 && this.imageHeight > 0 && this.containerWidth > 0 && this.containerHeight > 0) {
      this.centerImage();
    }
  }

  isZoomed(): boolean {
    return Math.abs(this.state.scale - this.defaultScale) > 0.01;
  }

  getScalePercentage(): number {
    return Math.round(this.state.scale * 100);
  }

  getCSS(): string {
    return `transform: translate(${this.state.translateX}px, ${this.state.translateY}px) scale(${this.state.scale})`;
  }
}
