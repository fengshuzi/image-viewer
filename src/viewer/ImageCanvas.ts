import type { ImageFile, ImageViewerSettings, ZoomState } from '../types';
import { ZoomManager } from '../utils/zoom';

export class ImageCanvas {
  private container: HTMLElement;
  private imageEl: HTMLImageElement;
  private settings: ImageViewerSettings;
  private zoomManager: ZoomManager;
  private currentImage: ImageFile | null = null;
  private rotation: number = 0;
  private flipH: boolean = false;
  private isDragging: boolean = false;
  private dragStart: { x: number; y: number } = { x: 0, y: 0 };
  private scrollMode: boolean = false;
  private preloadCache: Map<string, string> = new Map();
  private wheelThrottleTimer: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseUp: () => void;

  onZoomChange?: (scale: number) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;

  getImageElement(): HTMLImageElement {
    return this.imageEl;
  }

  constructor(container: HTMLElement, settings: ImageViewerSettings) {
    this.container = container;
    this.settings = settings;
    this.zoomManager = new ZoomManager(settings);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.imageEl = document.createElement('img');
    this.imageEl.className = 'image-viewer-canvas';
    this.setupImage();
    this.container.appendChild(this.imageEl);

    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => this.onContainerResize());
    });
    this.resizeObserver.observe(this.container);
  }

  private setupImage(): void {
    this.imageEl.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.boundOnMouseMove);
    document.addEventListener('mouseup', this.boundOnMouseUp);

    this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.imageEl.addEventListener('dblclick', () => this.resetZoom());
    this.imageEl.addEventListener('load', this.onImageLoad.bind(this));

    this.imageEl.addEventListener('error', () => {
      this.imageEl.setCssProps({ 'opacity': '1' });
      this.imageEl.alt = 'Failed to load image';
    });
  }

  updateSettings(settings: ImageViewerSettings): void {
    this.settings = settings;
    this.zoomManager.updateSettings(settings);
  }

  loadImage(image: ImageFile): void {
    this.currentImage = image;
    this.rotation = 0;
    this.flipH = false;

    this.imageEl.classList.add('fading');

    const url = this.preloadCache.get(image.path) || image.file.vault.getResourcePath(image.file);
    this.preloadCache.set(image.path, url);

    requestAnimationFrame(() => {
      this.imageEl.src = url;
      this.imageEl.alt = image.name;
    });
  }

  preload(images: ImageFile[]): void {
    for (const img of images) {
      if (this.preloadCache.has(img.path)) continue;
      const url = img.file.vault.getResourcePath(img.file);
      this.preloadCache.set(img.path, url);
      const preloadImg = new Image();
      preloadImg.src = url;
    }
  }

  private onImageLoad(): void {
    this.zoomManager.setImageDimensions(this.imageEl.naturalWidth, this.imageEl.naturalHeight);
    this.scheduleLayoutUpdate();
  }

  private scheduleLayoutUpdate(retries = 0): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const rect = this.container.getBoundingClientRect();
        if ((rect.width > 0 && rect.height > 0) || retries >= 5) {
          this.updateLayoutFromContainer();
        } else {
          setTimeout(() => this.scheduleLayoutUpdate(retries + 1), 50);
        }
      });
    });
  }

  private onContainerResize(): void {
    if (!this.currentImage || this.imageEl.naturalWidth === 0) return;

    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.zoomManager.setContainerDimensions(rect.width, rect.height);
    if (!this.zoomManager.isZoomed()) {
      this.zoomManager.reset();
    } else {
      this.zoomManager.recenter();
    }
    this.applyTransform();

    if (this.onZoomChange) {
      this.onZoomChange(this.zoomManager.getScalePercentage());
    }
  }

  private updateLayoutFromContainer(): void {
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.zoomManager.setContainerDimensions(rect.width, rect.height);
    this.zoomManager.reset();
    this.applyTransform();
    this.imageEl.classList.remove('fading');

    if (this.onZoomChange) {
      this.onZoomChange(this.zoomManager.getScalePercentage());
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    e.preventDefault();

    this.isDragging = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.imageEl.setCssProps({ 'cursor': 'grabbing' });
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.dragStart.x;
    const deltaY = e.clientY - this.dragStart.y;

    this.dragStart = { x: e.clientX, y: e.clientY };
    this.zoomManager.pan(deltaX, deltaY);
    this.applyTransform();
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.imageEl.setCssProps({ 'cursor': 'grab' });
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const rect = this.container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      if (e.deltaY < 0) {
        this.zoomManager.zoomIn(cursorX, cursorY);
      } else {
        this.zoomManager.zoomOut(cursorX, cursorY);
      }

      this.applyTransform();

      if (this.onZoomChange) {
        this.onZoomChange(this.zoomManager.getScalePercentage());
      }
    } else if (this.scrollMode || this.settings.scrollBehavior === 'scroll') {
      this.zoomManager.pan(0, -e.deltaY);
      this.applyTransform();
    } else if (this.settings.scrollBehavior === 'navigate' && this.onNavigate) {
      const now = Date.now();
      if (now - this.wheelThrottleTimer > 200) {
        this.wheelThrottleTimer = now;
        this.onNavigate(e.deltaY > 0 ? 'next' : 'prev');
      }
    }
  }

  zoomIn(): void {
    this.zoomManager.zoomIn();
    this.applyTransform();
    if (this.onZoomChange) {
      this.onZoomChange(this.zoomManager.getScalePercentage());
    }
  }

  zoomOut(): void {
    this.zoomManager.zoomOut();
    this.applyTransform();
    if (this.onZoomChange) {
      this.onZoomChange(this.zoomManager.getScalePercentage());
    }
  }

  resetZoom(): void {
    this.zoomManager.reset();
    this.applyTransform();
    if (this.onZoomChange) {
      this.onZoomChange(this.zoomManager.getScalePercentage());
    }
  }

  setZoom(scale: number): void {
    this.zoomManager.setScale(scale);
    this.applyTransform();
    if (this.onZoomChange) {
      this.onZoomChange(this.zoomManager.getScalePercentage());
    }
  }

  toggleScrollMode(): void {
    this.scrollMode = !this.scrollMode;
  }

  rotateCW(): void {
    this.rotation = (this.rotation + 90) % 360;
    this.applyTransform();
  }

  rotateCCW(): void {
    this.rotation = (this.rotation - 90 + 360) % 360;
    this.applyTransform();
  }

  flipHorizontal(): void {
    this.flipH = !this.flipH;
    this.applyTransform();
  }

  private applyTransform(): void {
    const state = this.zoomManager.getState();
    const flipScale = this.flipH ? -1 : 1;
    const sx = state.scale * flipScale;
    const sy = state.scale; // 始终 sx/sy 同比例，保持图片宽高比

    this.imageEl.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${sx}, ${sy}) rotate(${this.rotation}deg)`;
  }

  getZoomState(): ZoomState {
    return this.zoomManager.getState();
  }

  getCurrentImage(): ImageFile | null {
    return this.currentImage;
  }

  resize(): void {
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.zoomManager.setContainerDimensions(rect.width, rect.height);
    this.zoomManager.recenter();
    this.applyTransform();
  }

  isZoomed(): boolean {
    return this.zoomManager.isZoomed();
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    document.removeEventListener('mousemove', this.boundOnMouseMove);
    document.removeEventListener('mouseup', this.boundOnMouseUp);
    this.imageEl.remove();
  }
}
