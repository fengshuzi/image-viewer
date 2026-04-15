import { App, Modal, Setting } from 'obsidian';
import type { ImageFile } from '../types';

export interface CropResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class CropModal extends Modal {
  private image: ImageFile;
  private imageEl: HTMLImageElement;
  private canvasEl: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private selection: { x: number; y: number; width: number; height: number } | null = null;
  private isSelecting: boolean = false;
  private startPoint: { x: number; y: number } = { x: 0, y: 0 };
  private shiftPressed: boolean = false;
  private scale: number = 1;
  private imageWidth: number = 0;
  private imageHeight: number = 0;

  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnKeyUp: (e: KeyboardEvent) => void;

  onCrop?: (result: CropResult) => void;

  constructor(app: App, image: ImageFile) {
    super(app);
    this.image = image;
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);
  }

  async onOpen(): Promise<void> {
    const { contentEl, modalEl } = this;
    contentEl.addClass('image-viewer-crop-modal');

    // Make modal larger
    modalEl.setCssProps({
      'width': '90vw',
      'height': '90vh',
      'max-width': '1200px',
      'max-height': '800px'
    });

    contentEl.createEl('h2', { text: 'Crop Image' });

    // Canvas container
    const canvasContainer = contentEl.createDiv({ cls: 'crop-canvas-container' });
    this.canvasEl = canvasContainer.createEl('canvas');
    this.ctx = this.canvasEl.getContext('2d')!;

    // Load image
    await this.loadImage();

    // Mouse events
    this.canvasEl.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvasEl.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvasEl.addEventListener('mouseup', this.onMouseUp.bind(this));

    document.addEventListener('keydown', this.boundOnKeyDown);
    document.addEventListener('keyup', this.boundOnKeyUp);

    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: 'crop-buttons' });
    new Setting(buttonContainer)
      .addButton(btn => btn
        .setButtonText('Cancel')
        .onClick(() => this.close()))
      .addButton(btn => btn
        .setButtonText('Crop')
        .setCta()
        .onClick(() => this.applyCrop()));
  }

  private async loadImage(): Promise<void> {
    const url = this.image.file.vault.getResourcePath(this.image.file);

    this.imageEl = new Image();
    this.imageEl.src = url;

    await new Promise<void>((resolve) => {
      this.imageEl.onload = () => {
        this.imageWidth = this.imageEl.naturalWidth;
        this.imageHeight = this.imageEl.naturalHeight;

        // Calculate scale to fit in modal
        const maxWidth = this.contentEl.clientWidth - 40;
        const maxHeight = this.contentEl.clientHeight - 100;
        this.scale = Math.min(maxWidth / this.imageWidth, maxHeight / this.imageHeight, 1);

        this.canvasEl.width = this.imageWidth * this.scale;
        this.canvasEl.height = this.imageHeight * this.scale;

        this.drawImage();
        resolve();
      };
    });
  }

  private drawImage(): void {
    this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    this.ctx.drawImage(
      this.imageEl,
      0, 0,
      this.imageWidth, this.imageHeight,
      0, 0,
      this.canvasEl.width, this.canvasEl.height
    );

    if (this.selection) {
      this.drawSelection();
    }
  }

  private drawSelection(): void {
    if (!this.selection) return;

    const { x, y, width, height } = this.selection;

    // Dim outside selection
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);

    // Clear selection area
    this.ctx.clearRect(x, y, width, height);
    this.ctx.drawImage(
      this.imageEl,
      x / this.scale, y / this.scale,
      width / this.scale, height / this.scale,
      x, y,
      width, height
    );

    // Draw selection border
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.setLineDash([]);

    // Draw corner handles
    this.drawHandle(x, y);
    this.drawHandle(x + width, y);
    this.drawHandle(x, y + height);
    this.drawHandle(x + width, y + height);
  }

  private drawHandle(x: number, y: number): void {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(x - 4, y - 4, 8, 8);
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.canvasEl.getBoundingClientRect();
    this.isSelecting = true;
    this.startPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    this.selection = null;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isSelecting) return;

    const rect = this.canvasEl.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    let width = currentX - this.startPoint.x;
    let height = currentY - this.startPoint.y;

    // Hold shift for square selection
    if (this.shiftPressed) {
      const size = Math.max(Math.abs(width), Math.abs(height));
      width = width >= 0 ? size : -size;
      height = height >= 0 ? size : -size;
    }

    this.selection = {
      x: width >= 0 ? this.startPoint.x : this.startPoint.x + width,
      y: height >= 0 ? this.startPoint.y : this.startPoint.y + height,
      width: Math.abs(width),
      height: Math.abs(height)
    };

    this.drawImage();
  }

  private onMouseUp(): void {
    this.isSelecting = false;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Shift') {
      this.shiftPressed = true;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.key === 'Shift') {
      this.shiftPressed = false;
    }
  }

  private applyCrop(): void {
    if (!this.selection || this.selection.width === 0 || this.selection.height === 0) {
      return;
    }

    const result: CropResult = {
      x: Math.round(this.selection.x / this.scale),
      y: Math.round(this.selection.y / this.scale),
      width: Math.round(this.selection.width / this.scale),
      height: Math.round(this.selection.height / this.scale)
    };

    if (this.onCrop) {
      this.onCrop(result);
    }

    this.close();
  }

  onClose(): void {
    document.removeEventListener('keydown', this.boundOnKeyDown);
    document.removeEventListener('keyup', this.boundOnKeyUp);
    const { contentEl } = this;
    contentEl.empty();
  }
}
