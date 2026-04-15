import type { ImageFile, ExifData } from '../types';
import { ExifParser } from '../utils/exif';
import { App } from 'obsidian';

export class InfoPanel {
  private wrapper: HTMLElement;
  private panelEl: HTMLElement;
  private contentEl: HTMLElement;
  private app: App;
  private visible: boolean = false;

  constructor(wrapper: HTMLElement, app: App) {
    this.wrapper = wrapper;
    this.app = app;

    this.panelEl = wrapper.createDiv({ cls: 'image-viewer-info-panel' });

    const header = this.panelEl.createDiv({ cls: 'info-panel-header' });
    header.createEl('span', { text: 'Image info' });
    const closeBtn = header.createEl('button', { cls: 'info-panel-close' });
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.toggle());

    this.contentEl = this.panelEl.createDiv({ cls: 'info-panel-content' });
  }

  isVisible(): boolean {
    return this.visible;
  }

  toggle(): void {
    this.visible = !this.visible;
    this.panelEl.classList.toggle('visible', this.visible);
    this.wrapper.classList.toggle('visible', this.visible);
  }

  hide(): void {
    this.visible = false;
    this.panelEl.classList.remove('visible');
    this.wrapper.classList.remove('visible');
  }

  async update(image: ImageFile | null, dimensions: { width: number; height: number }): Promise<void> {
    this.contentEl.empty();
    if (!image) return;

    this.addSection('File');
    this.addRow('Name', image.name);
    this.addRow('Path', image.path);
    this.addRow('Size', this.formatSize(image.size));
    this.addRow('Created', new Date(image.ctime).toLocaleString());
    this.addRow('Modified', new Date(image.mtime).toLocaleString());

    // 添加引用该图片的文档链接
    this.renderBacklinks(image);

    if (dimensions.width > 0) {
      this.addSection('Dimensions');
      this.addRow('Resolution', `${dimensions.width} \u00d7 ${dimensions.height}`);
      const mp = (dimensions.width * dimensions.height) / 1000000;
      this.addRow('Megapixels', mp.toFixed(2) + ' MP');
    }

    try {
      const file = await this.app.vault.readBinary(image.file);
      const blob = new Blob([file], { type: `image/${image.extension}` });
      const fileObj = new File([blob], image.name);
      const exif = await ExifParser.parse(fileObj);
      this.renderExif(exif);
    } catch {
      // EXIF not available
    }
  }

  private renderBacklinks(image: ImageFile): void {
    // 获取引用该图片的所有文档
    const linkedFiles: string[] = [];

    // 遍历所有已解析的链接
    const resolvedLinks = this.app.metadataCache.resolvedLinks;

    for (const [sourcePath, links] of Object.entries(resolvedLinks)) {
      if (image.path in links) {
        linkedFiles.push(sourcePath);
      }
    }

    if (linkedFiles.length > 0) {
      this.addSection('Referenced In');

      const row = this.contentEl.createDiv({ cls: 'info-panel-row' });

      // 创建链接列表容器
      const linksContainer = row.createEl('div', { cls: 'info-panel-value' });

      linkedFiles.forEach((path, index) => {
        if (index > 0) {
          linksContainer.createEl('br');
        }

        const link = linksContainer.createEl('a', {
          cls: 'info-panel-link',
          text: this.getFileName(path)
        });

        link.href = '#';
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.openFile(path);
        });
      });
    }
  }

  private getFileName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  private openFile(path: string): void {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file) {
      void this.app.workspace.openLinkText(file.path, '', true);
    }
  }

  private renderExif(exif: ExifData): void {
    const hasData = exif.make || exif.model || exif.exposureTime || exif.fNumber || exif.iso || exif.focalLength || exif.dateTime;
    if (!hasData) return;

    this.addSection('EXIF');
    if (exif.make || exif.model) {
      this.addRow('Camera', `${exif.make || ''} ${exif.model || ''}`.trim());
    }
    if (exif.exposureTime) this.addRow('Shutter', exif.exposureTime + 's');
    if (exif.fNumber) this.addRow('Aperture', 'f/' + exif.fNumber.toFixed(1));
    if (exif.iso) this.addRow('ISO', exif.iso.toString());
    if (exif.focalLength) this.addRow('Focal', exif.focalLength + 'mm');
    if (exif.dateTime) this.addRow('Date', this.formatExifDate(exif.dateTime));
  }

  private addSection(title: string): void {
    this.contentEl.createEl('h4', { cls: 'info-panel-section', text: title });
  }

  private addRow(label: string, value: string): void {
    const row = this.contentEl.createDiv({ cls: 'info-panel-row' });
    row.createEl('span', { cls: 'info-panel-label', text: label });
    row.createEl('span', { cls: 'info-panel-value', text: value });
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  private formatExifDate(dateStr: string): string {
    const parts = dateStr.split(' ');
    if (parts.length === 2) {
      const d = parts[0].split(':');
      if (d.length === 3) return `${d[0]}-${d[1]}-${d[2]} ${parts[1]}`;
    }
    return dateStr;
  }

  destroy(): void {
    this.panelEl.remove();
  }
}
