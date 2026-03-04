import { TFile, TFolder, TAbstractFile, App } from 'obsidian';
import type { ImageFile, ImageViewerSettings } from '../types';

export class ImageLoader {
  private app: App;
  private settings: ImageViewerSettings;

  constructor(app: App, settings: ImageViewerSettings) {
    this.app = app;
    this.settings = settings;
  }

  updateSettings(settings: ImageViewerSettings): void {
    this.settings = settings;
  }

  isImageFile(file: TAbstractFile): file is TFile {
    if (!(file instanceof TFile)) return false;
    const ext = file.extension.toLowerCase();
    return this.settings.imageExtensions.includes(ext);
  }

  async loadImagesFromFolder(folderPath: string): Promise<ImageFile[]> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !(folder instanceof TFolder)) {
      return [];
    }

    const images: ImageFile[] = [];

    const collectImages = (folder: TFolder) => {
      for (const child of folder.children) {
        if (child instanceof TFile && this.isImageFile(child)) {
          images.push({
            file: child,
            path: child.path,
            name: child.name,
            extension: child.extension,
            size: child.stat.size,
            ctime: child.stat.ctime,
            mtime: child.stat.mtime
          });
        } else if (child instanceof TFolder && this.settings.scanSubfolders) {
          collectImages(child);
        }
      }
    };

    collectImages(folder);

    // Sort images
    return this.sortImages(images);
  }

  private sortImages(images: ImageFile[]): ImageFile[] {
    const sorted = [...images];

    switch (this.settings.sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date':
        sorted.sort((a, b) => a.mtime - b.mtime);
        break;
      case 'size':
        sorted.sort((a, b) => a.size - b.size);
        break;
      case 'random':
        for (let i = sorted.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        }
        break;
    }

    if (!this.settings.sortAscending && this.settings.sortBy !== 'random') {
      sorted.reverse();
    }

    return sorted;
  }

  async getImageUrl(file: TFile): Promise<string> {
    return this.app.vault.getResourcePath(file);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getImageDimensions(file: TFile): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      this.getImageUrl(file).then(url => {
        img.src = url;
      });
    });
  }
}
