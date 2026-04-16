import { ItemView, WorkspaceLeaf, Notice, Modal, Setting, setIcon } from 'obsidian';
import type { ImageFile, ImageViewerSettings } from '../types';
import { ImageCanvas } from './ImageCanvas';
import { Gallery } from './Gallery';
import { Toolbar } from './Toolbar';
import { InfoPanel } from './InfoPanel';
import { CropModal } from './CropModal';
import { ImageLoader } from '../utils/imageLoader';
import { KeyboardManager } from '../utils/keyboard';
import type ImageViewerPlugin from '../../main';

export const VIEW_TYPE_IMAGE_VIEWER = 'image-viewer';

export class ImageView extends ItemView {
  private plugin: ImageViewerPlugin;
  private settings: ImageViewerSettings;

  private canvas: ImageCanvas | null = null;
  private gallery: Gallery | null = null;
  private toolbar: Toolbar | null = null;
  private infoPanel: InfoPanel | null = null;

  private images: ImageFile[] = [];
  private currentIndex: number = 0;
  private currentFolder: string = '';
  private galleryVisible: boolean = false;
  private infoPanelVisible: boolean = false;
  private uiVisible: boolean = true;
  private slideshowTimer: ReturnType<typeof setInterval> | null = null;
  private isClosing: boolean = false;

  private mainContainer: HTMLElement;
  private imageContainer: HTMLElement;
  private canvasWrapper: HTMLElement;
  private galleryContainer: HTMLElement;
  private toolbarContainer: HTMLElement;
  private infoBar: HTMLElement;
  private infoPanelContainer: HTMLElement;

  private imageLoader: ImageLoader;
  private keyboardManager: KeyboardManager;

  constructor(leaf: WorkspaceLeaf, plugin: ImageViewerPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.settings = plugin.settings;
    this.imageLoader = new ImageLoader(this.app, this.settings);
    this.keyboardManager = new KeyboardManager(this.settings);
    this.setupKeyboardHandlers();
  }

  getViewType(): string {
    return VIEW_TYPE_IMAGE_VIEWER;
  }

  getDisplayText(): string {
    const currentImage = this.images[this.currentIndex];
    return currentImage ? currentImage.name : 'Image viewer';
  }

  getIcon(): string {
    return 'image';
  }

  onOpen(): Promise<void> {
    const { containerEl } = this;
    containerEl.addClass('image-viewer-container');
    containerEl.empty();
    containerEl.tabIndex = 0;

    this.mainContainer = containerEl.createDiv({ cls: 'image-viewer-main' });

    // Image area - use a canvas wrapper so we can shrink when info panel is open
    this.imageContainer = this.mainContainer.createDiv({ cls: 'image-viewer-image-container' });
    this.canvasWrapper = this.imageContainer.createDiv({ cls: 'image-viewer-canvas-wrapper' });
    this.canvas = new ImageCanvas(this.canvasWrapper, this.settings);
    this.canvas.onZoomChange = (scale) => {
      this.toolbar?.setZoom(scale);
    };
    this.canvas.onNavigate = (dir) => {
      if (dir === 'prev') void this.prev();
      else void this.next();
    };

    this.createNavArrows();

    this.galleryContainer = this.canvasWrapper.createDiv({ cls: 'image-viewer-gallery-strip' });
    this.gallery = new Gallery(this.galleryContainer, this.settings);
    this.gallery.onSelect = (index) => {
      void this.setIndex(index);
    };

    this.toolbarContainer = this.canvasWrapper.createDiv({ cls: 'image-viewer-toolbar-container' });
    this.toolbar = new Toolbar(this.toolbarContainer, this.settings, {
      onPrev: () => { void this.prev(); },
      onNext: () => { void this.next(); },
      onZoomIn: () => this.canvas?.zoomIn(),
      onZoomOut: () => this.canvas?.zoomOut(),
      onResetZoom: () => this.canvas?.resetZoom(),
      onRotateCW: () => this.canvas?.rotateCW(),
      onRotateCCW: () => this.canvas?.rotateCCW(),
      onToggleGallery: () => this.toggleGallery(),
      onToggleInfo: () => this.toggleInfoPanel(),
      onToggleSlideshow: () => this.toggleSlideshow(),
      onSettings: () => this.showSettings(),
      onClose: () => this.close()
    });

    this.infoBar = this.canvasWrapper.createDiv({ cls: 'image-viewer-info-bar' });

    this.infoPanelContainer = this.imageContainer.createDiv({ cls: 'image-viewer-info-panel-wrapper' });
    this.infoPanel = new InfoPanel(this.infoPanelContainer, this.app);

    // Keyboard
    this.registerDomEvent(containerEl, 'keydown', (e) => {
      this.keyboardManager.handle(e);
    });

    this.applyTheme();
    containerEl.focus();
    return Promise.resolve();
  }

  private createNavArrows(): void {
    const leftArrow = this.canvasWrapper.createDiv({ cls: 'image-viewer-nav-arrow prev' });
    setIcon(leftArrow, 'chevron-left');
    leftArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.prev();
    });

    const rightArrow = this.canvasWrapper.createDiv({ cls: 'image-viewer-nav-arrow next' });
    setIcon(rightArrow, 'chevron-right');
    rightArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.next();
    });
  }

  private setupKeyboardHandlers(): void {
    const { KEYS } = KeyboardManager;

    // Navigation
    this.keyboardManager.register(KEYS.PREV, () => { void this.prev(); });
    this.keyboardManager.register(KEYS.PREV_ALT, () => { void this.prev(); });
    this.keyboardManager.register(KEYS.NEXT, () => { void this.next(); });
    this.keyboardManager.register(KEYS.NEXT_ALT, () => { void this.next(); });
    this.keyboardManager.register(KEYS.FIRST, () => { void this.setIndex(0); });
    this.keyboardManager.register(KEYS.FIRST_ALT, () => { void this.setIndex(0); });
    this.keyboardManager.register(KEYS.LAST, () => { void this.setIndex(this.images.length - 1); });
    this.keyboardManager.register(KEYS.LAST_ALT, () => { void this.setIndex(this.images.length - 1); });

    // View
    this.keyboardManager.register(KEYS.TOGGLE_GALLERY, () => this.toggleGallery());
    this.keyboardManager.register(KEYS.TOGGLE_INFO, () => this.toggleInfoPanel());
    this.keyboardManager.register(KEYS.TOGGLE_UI, () => this.toggleUI());
    this.keyboardManager.register(KEYS.FULLSCREEN, () => { void this.toggleFullscreen(); });
    this.keyboardManager.register(KEYS.FULLSCREEN_ALT, () => { void this.toggleFullscreen(); });
    this.keyboardManager.register(KEYS.ESCAPE, () => this.handleEscape());

    // Zoom
    this.keyboardManager.register(KEYS.ZOOM_IN, () => this.canvas?.zoomIn());
    this.keyboardManager.register(KEYS.ZOOM_IN_ALT, () => this.canvas?.zoomIn());
    this.keyboardManager.register(KEYS.ZOOM_OUT, () => this.canvas?.zoomOut());
    this.keyboardManager.register(KEYS.RESET_ZOOM, () => this.canvas?.resetZoom());
    this.keyboardManager.register(KEYS.TOGGLE_SCROLL_MODE, () => this.canvas?.toggleScrollMode());

    // Edit
    this.keyboardManager.register(KEYS.ROTATE_CW, () => this.canvas?.rotateCW());
    this.keyboardManager.register(KEYS.ROTATE_CCW, () => this.canvas?.rotateCCW());
    this.keyboardManager.register(KEYS.FLIP_H, () => this.canvas?.flipHorizontal());
    this.keyboardManager.register(KEYS.CROP, () => this.showCrop());

    // File
    this.keyboardManager.register(KEYS.RENAME, () => { void this.renameFile(); });
    this.keyboardManager.register(KEYS.DELETE, () => { void this.deleteFile(); });
    this.keyboardManager.register(KEYS.DELETE_PERMANENT, () => { void this.deleteFile(true); });

    // Slideshow
    this.keyboardManager.register(KEYS.TOGGLE_SLIDESHOW, () => this.toggleSlideshow());
    this.keyboardManager.register(KEYS.TOGGLE_LOOP, () => this.toggleLoop());

    // Other
    this.keyboardManager.register(KEYS.HELP, () => this.showHelp());
    this.keyboardManager.register(KEYS.TOGGLE_BG, () => this.cycleBackground());
  }

  loadFolder(folderPath: string, initialImage?: string): void {
    this.currentFolder = folderPath;
    this.images = this.imageLoader.loadImagesFromFolder(folderPath);

    if (this.images.length === 0) {
      new Notice('No images found in folder');
      return;
    }

    if (initialImage) {
      const index = this.images.findIndex(img => img.path === initialImage);
      this.currentIndex = index >= 0 ? index : 0;
    } else {
      this.currentIndex = 0;
    }

    this.gallery?.setImages(this.images);
    this.gallery?.setCurrentIndex(this.currentIndex);
    this.loadCurrentImage();
  }

  private loadCurrentImage(): void {
    const image = this.images[this.currentIndex];
    if (!image) return;

    this.canvas?.loadImage(image);

    this.toolbar?.setCounter(this.currentIndex + 1, this.images.length);
    this.updateInfoBar();
    this.updateTitle();
    this.preloadAdjacentImages();

    if (this.infoPanelVisible) {
      void this.updateInfoPanel();
    }
  }

  private preloadAdjacentImages(): void {
    const toPreload: ImageFile[] = [];
    if (this.currentIndex > 0) toPreload.push(this.images[this.currentIndex - 1]);
    if (this.currentIndex < this.images.length - 1) toPreload.push(this.images[this.currentIndex + 1]);
    this.canvas?.preload(toPreload);
  }

  private updateInfoBar(): void {
    const image = this.images[this.currentIndex];
    if (!image || !this.infoBar) return;

    const parts: string[] = [image.name];
    if (this.settings.showFilePath) parts.push(image.path);
    parts.push(this.imageLoader.formatFileSize(image.size));
    parts.push(new Date(image.mtime).toLocaleDateString());

    this.infoBar.textContent = parts.join(' | ');
  }

  private updateTitle(): void {
    const image = this.images[this.currentIndex];
    if (image) {
      const leafInternal = this.leaf as unknown as { tabHeaderInnerTitleEl?: HTMLElement };
      const tabHeaderEl = leafInternal.tabHeaderInnerTitleEl;
      if (tabHeaderEl) {
        tabHeaderEl.textContent = image.name;
      }
    }
  }

  private async updateInfoPanel(): Promise<void> {
    const image = this.images[this.currentIndex];
    if (!image) return;
    const img = this.imageContainer.querySelector('img.image-viewer-canvas') as HTMLImageElement | null;
    const dimensions = {
      width: img?.naturalWidth || 0,
      height: img?.naturalHeight || 0
    };
    await this.infoPanel?.update(image, dimensions);
  }

  setIndex(index: number): void {
    if (index < 0) {
      index = this.settings.loopImages ? this.images.length - 1 : 0;
      if (!this.settings.loopImages) return;
    } else if (index >= this.images.length) {
      index = this.settings.loopImages ? 0 : this.images.length - 1;
      if (!this.settings.loopImages) return;
    }

    this.currentIndex = index;
    this.gallery?.setCurrentIndex(index);
    this.loadCurrentImage();
  }

  prev(): void {
    this.setIndex(this.currentIndex - 1);
  }

  next(): void {
    this.setIndex(this.currentIndex + 1);
  }

  toggleGallery(): void {
    this.galleryVisible = !this.galleryVisible;
    this.galleryContainer.classList.toggle('visible', this.galleryVisible);
    if (this.galleryVisible) {
      this.gallery?.focus();
    }
  }

  toggleInfoPanel(): void {
    this.infoPanelVisible = !this.infoPanelVisible;
    this.infoPanel?.toggle();
    if (this.infoPanelVisible) {
      void this.updateInfoPanel();
    }
    setTimeout(() => this.canvas?.resize(), 300);
  }

  toggleUI(): void {
    this.uiVisible = !this.uiVisible;
    this.toolbar?.setVisible(this.uiVisible);
    this.infoBar.style.display = this.uiVisible ? 'block' : 'none';
  }

  async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await this.containerEl.requestFullscreen();
    }
  }

  private handleEscape(): void {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (this.infoPanelVisible) {
      this.toggleInfoPanel();
    } else if (this.canvas?.isZoomed()) {
      this.canvas.resetZoom();
    } else if (this.galleryVisible) {
      this.toggleGallery();
    } else {
      this.close();
    }
  }

  showCrop(): void {
    const image = this.images[this.currentIndex];
    if (!image) return;

    const modal = new CropModal(this.app, image);
    modal.onCrop = (result) => {
      console.debug('Crop result:', result);
    };
    modal.open();
  }

  toggleSlideshow(): void {
    if (this.slideshowTimer) {
      this.stopSlideshow();
    } else {
      this.startSlideshow();
    }
  }

  private startSlideshow(): void {
    this.slideshowTimer = setInterval(() => {
      if (this.settings.slideshowRandom) {
        const randomIndex = Math.floor(Math.random() * this.images.length);
        void this.setIndex(randomIndex);
      } else {
        if (this.currentIndex === this.images.length - 1 && !this.settings.slideshowLoop) {
          this.stopSlideshow();
          return;
        }
        void this.next();
      }
    }, this.settings.slideshowInterval * 1000);

    this.toolbar?.setSlideshowPlaying(true);
    new Notice('Slideshow started');
  }

  private stopSlideshow(): void {
    if (this.slideshowTimer) {
      clearInterval(this.slideshowTimer);
      this.slideshowTimer = null;
    }
    this.toolbar?.setSlideshowPlaying(false);
    new Notice('Slideshow stopped');
  }

  toggleLoop(): void {
    this.settings.loopImages = !this.settings.loopImages;
    void this.plugin.saveSettings();
    new Notice(`Loop: ${this.settings.loopImages ? 'On' : 'Off'}`);
  }

  cycleBackground(): void {
    const colors = ['#1a1a1a', '#2d2d2d', '#000000', '#ffffff'];
    const currentBgIndex = colors.indexOf(this.settings.backgroundColor);
    const nextIndex = (currentBgIndex + 1) % colors.length;
    this.settings.backgroundColor = colors[nextIndex];
    void this.plugin.saveSettings();
    this.applyTheme();
  }

  async renameFile(): Promise<void> {
    const image = this.images[this.currentIndex];
    if (!image) return;

    const baseName = image.name.replace(/\.[^.]+$/, '');

    const newBaseName = await new Promise<string | null>((resolve) => {
      const modal = new Modal(this.app);
      modal.titleEl.setText('Rename file');

      let inputEl: HTMLInputElement;
      new Setting(modal.contentEl)
        .setName('New name')
        .setDesc(`Extension .${image.extension} will be kept`)
        .addText(text => {
          text.setValue(baseName);
          inputEl = text.inputEl;
          setTimeout(() => {
            inputEl.focus();
            inputEl.select();
          }, 50);
        });

      new Setting(modal.contentEl)
        .addButton(btn => btn.setButtonText('Cancel').onClick(() => {
          modal.close();
          resolve(null);
        }))
        .addButton(btn => btn.setButtonText('Rename').setCta().onClick(() => {
          modal.close();
          resolve(inputEl.value.trim());
        }));

      modal.open();
    });

    if (newBaseName && newBaseName !== baseName) {
      const newPath = image.file.parent?.path + '/' + newBaseName + '.' + image.extension;
      if (newPath) {
        await this.app.fileManager.renameFile(image.file, newPath);
        new Notice('File renamed');
        this.loadFolder(this.currentFolder, newPath);
      }
    }
  }

  async deleteFile(permanent: boolean = false): Promise<void> {
    const image = this.images[this.currentIndex];
    if (!image) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      const modal = new Modal(this.app);
      modal.titleEl.setText(permanent ? 'Permanently delete?' : 'Move to trash?');

      const msg = permanent
        ? `"${image.name}" will be permanently deleted. This cannot be undone.`
        : `"${image.name}" will be moved to trash.`;
      modal.contentEl.createEl('p', { text: msg });

      new Setting(modal.contentEl)
        .addButton(btn => btn.setButtonText('Cancel').onClick(() => {
          modal.close();
          resolve(false);
        }))
        .addButton(btn => {
          btn.setButtonText(permanent ? 'Delete' : 'Move to trash');
          if (permanent) btn.setWarning();
          else btn.setCta();
          btn.onClick(() => {
            modal.close();
            resolve(true);
          });
        });

      modal.open();
    });

    if (!confirmed) return;

    if (permanent) {
      await this.app.vault.delete(image.file);
      new Notice('File permanently deleted');
    } else {
      await this.app.fileManager.trashFile(image.file);
      new Notice('File moved to trash');
    }

    this.images.splice(this.currentIndex, 1);

    if (this.images.length === 0) {
      this.close();
      return;
    }

    if (this.currentIndex >= this.images.length) {
      this.currentIndex = this.images.length - 1;
    }

    this.gallery?.setImages(this.images);
    this.gallery?.setCurrentIndex(this.currentIndex);
    this.loadCurrentImage();
  }

  showSettings(): void {
    // @ts-ignore
    this.app.setting.open();
    // @ts-ignore
    this.app.setting.openTabById('obsidian-image-viewer');
  }

  showHelp(): void {
    const modal = new Modal(this.app);
    modal.titleEl.setText('Keyboard shortcuts');

    const content = modal.contentEl.createDiv({ cls: 'image-viewer-help' });

    const shortcuts: [string, string][] = [
      ['Navigation', ''],
      ['\u2190 / A', 'Previous image'],
      ['\u2192 / D', 'Next image'],
      ['Home', 'First image'],
      ['End', 'Last image'],
      ['', ''],
      ['View', ''],
      ['G', 'Toggle gallery'],
      ['I', 'Toggle info panel'],
      ['Alt+Z', 'Toggle UI'],
      ['F11', 'Fullscreen'],
      ['Esc', 'Close / dismiss panels'],
      ['', ''],
      ['Zoom', ''],
      ['+', 'Zoom in'],
      ['-', 'Zoom out'],
      ['R', 'Reset zoom'],
      ['', ''],
      ['Edit', ''],
      [']', 'Rotate clockwise'],
      ['[', 'Rotate counter-clockwise'],
      ['F', 'Flip horizontal'],
      ['C', 'Crop'],
      ['', ''],
      ['File', ''],
      ['F2', 'Rename'],
      ['Del', 'Move to trash'],
      ['Shift+Del', 'Delete permanently'],
      ['', ''],
      ['Slideshow', ''],
      ['F5', 'Toggle slideshow'],
      ['L', 'Toggle loop']
    ];

    const table = content.createEl('table');
    shortcuts.forEach(([key, desc]) => {
      const row = table.createEl('tr');
      if (desc === '') {
        row.createEl('th', { text: key, attr: { colspan: '2' } });
      } else {
        row.createEl('td', { text: key });
        row.createEl('td', { text: desc });
      }
    });

    modal.open();
  }

  applyTheme(): void {
    this.containerEl.style.backgroundColor = this.settings.backgroundColor;
  }

  updateSettings(settings: ImageViewerSettings): void {
    this.settings = settings;
    this.imageLoader.updateSettings(settings);
    this.keyboardManager.updateSettings(settings);
    this.canvas?.updateSettings(settings);
    this.gallery?.updateSettings(settings);
    this.toolbar?.updateSettings(settings);
    this.applyTheme();
  }

  close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.stopSlideshow();
    this.leaf.detach();
  }

  onClose(): Promise<void> {
    this.stopSlideshow();
    this.canvas?.destroy();
    this.gallery?.destroy();
    this.toolbar?.destroy();
    this.infoPanel?.destroy();
    return Promise.resolve();
  }
}
