import type { ImageFile, ImageViewerSettings } from '../types';

const THUMB_GAP = 8;
const BUFFER_COUNT = 5;

export class Gallery {
  private container: HTMLElement;
  private settings: ImageViewerSettings;
  private images: ImageFile[] = [];
  private selectedIndex: number = 0;
  private scrollEl: HTMLElement;
  private trackEl: HTMLElement;
  private renderedRange: { start: number; end: number } = { start: -1, end: -1 };
  private thumbElements: Map<number, HTMLElement> = new Map();

  onSelect?: (index: number) => void;

  constructor(container: HTMLElement, settings: ImageViewerSettings) {
    this.container = container;
    this.settings = settings;

    this.scrollEl = document.createElement('div');
    this.scrollEl.className = 'image-viewer-gallery-scroll';

    this.trackEl = document.createElement('div');
    this.trackEl.className = 'image-viewer-gallery-track';

    this.scrollEl.appendChild(this.trackEl);
    this.container.appendChild(this.scrollEl);

    this.scrollEl.addEventListener('scroll', () => this.onScroll());
  }

  updateSettings(settings: ImageViewerSettings): void {
    this.settings = settings;
    this.updateTrackSize();
    this.renderVisible();
  }

  setImages(images: ImageFile[]): void {
    this.images = images;
    this.selectedIndex = 0;
    this.thumbElements.clear();
    this.renderedRange = { start: -1, end: -1 };
    this.updateTrackSize();
    this.renderVisible();
  }

  setCurrentIndex(index: number): void {
    if (this.selectedIndex === index) return;
    const prev = this.thumbElements.get(this.selectedIndex);
    if (prev) prev.classList.remove('selected');

    this.selectedIndex = index;

    const current = this.thumbElements.get(index);
    if (current) {
      current.classList.add('selected');
    }
    this.scrollToIndex(index);
  }

  private getThumbWidth(): number {
    return this.settings.thumbnailSize + THUMB_GAP;
  }

  private updateTrackSize(): void {
    const totalWidth = this.images.length * this.getThumbWidth();
    this.trackEl.style.width = `${totalWidth}px`;
  }

  private onScroll(): void {
    this.renderVisible();
  }

  private renderVisible(): void {
    if (this.images.length === 0) return;

    const thumbW = this.getThumbWidth();
    const scrollLeft = this.scrollEl.scrollLeft;
    const viewWidth = this.scrollEl.clientWidth;

    const startIdx = Math.max(0, Math.floor(scrollLeft / thumbW) - BUFFER_COUNT);
    const endIdx = Math.min(this.images.length - 1, Math.ceil((scrollLeft + viewWidth) / thumbW) + BUFFER_COUNT);

    if (startIdx === this.renderedRange.start && endIdx === this.renderedRange.end) return;

    // Remove out-of-range thumbnails
    for (const [idx, el] of this.thumbElements) {
      if (idx < startIdx || idx > endIdx) {
        el.remove();
        this.thumbElements.delete(idx);
      }
    }

    // Add new thumbnails
    for (let i = startIdx; i <= endIdx; i++) {
      if (!this.thumbElements.has(i)) {
        const thumb = this.createThumbnail(this.images[i], i);
        this.trackEl.appendChild(thumb);
        this.thumbElements.set(i, thumb);
      }
    }

    this.renderedRange = { start: startIdx, end: endIdx };
  }

  private createThumbnail(image: ImageFile, index: number): HTMLElement {
    const size = this.settings.thumbnailSize;
    const wrapper = document.createElement('div');
    wrapper.className = 'image-viewer-gallery-thumb' + (index === this.selectedIndex ? ' selected' : '');
    wrapper.style.left = `${index * this.getThumbWidth()}px`;
    wrapper.style.width = `${size}px`;
    wrapper.style.height = `${size}px`;

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = image.file.vault.getResourcePath(image.file);
    img.alt = image.name;

    wrapper.appendChild(img);

    wrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectAndNotify(index);
    });

    return wrapper;
  }

  private selectAndNotify(index: number): void {
    const prev = this.thumbElements.get(this.selectedIndex);
    if (prev) prev.classList.remove('selected');

    this.selectedIndex = index;

    const current = this.thumbElements.get(index);
    if (current) current.classList.add('selected');

    if (this.onSelect) {
      this.onSelect(index);
    }
  }

  private scrollToIndex(index: number): void {
    const thumbW = this.getThumbWidth();
    const thumbCenter = index * thumbW + thumbW / 2;
    const viewWidth = this.scrollEl.clientWidth;
    this.scrollEl.scrollTo({
      left: thumbCenter - viewWidth / 2,
      behavior: 'smooth'
    });
  }

  navigateLeft(): void {
    if (this.selectedIndex > 0) {
      this.selectAndNotify(this.selectedIndex - 1);
      this.scrollToIndex(this.selectedIndex);
    }
  }

  navigateRight(): void {
    if (this.selectedIndex < this.images.length - 1) {
      this.selectAndNotify(this.selectedIndex + 1);
      this.scrollToIndex(this.selectedIndex);
    }
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  focus(): void {
    this.scrollToIndex(this.selectedIndex);
  }

  destroy(): void {
    this.thumbElements.clear();
    this.scrollEl.remove();
  }
}
