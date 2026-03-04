import { App, Modal, Setting } from 'obsidian';
import type { ImageFile, ExifData } from '../types';
import { ExifParser } from '../utils/exif';

export class ImageInfoModal extends Modal {
  private image: ImageFile;
  private dimensions: { width: number; height: number };
  private exifData: ExifData | null = null;

  constructor(
    app: App,
    image: ImageFile,
    dimensions: { width: number; height: number }
  ) {
    super(app);
    this.image = image;
    this.dimensions = dimensions;
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.addClass('image-viewer-info-modal');

    contentEl.createEl('h2', { text: 'Image Information' });

    // File Information
    contentEl.createEl('h3', { text: '📁 File Information' });
    this.addInfoRow(contentEl, 'File Name', this.image.name);
    this.addInfoRow(contentEl, 'Path', this.image.path);
    this.addInfoRow(contentEl, 'Size', this.formatSize(this.image.size));
    this.addInfoRow(contentEl, 'Created', this.formatDate(this.image.ctime));
    this.addInfoRow(contentEl, 'Modified', this.formatDate(this.image.mtime));

    // Dimension Information
    contentEl.createEl('h3', { text: '📐 Dimensions' });
    this.addInfoRow(contentEl, 'Resolution', `${this.dimensions.width} × ${this.dimensions.height}`);
    this.addInfoRow(contentEl, 'Megapixels', this.calculateMegapixels());
    this.addInfoRow(contentEl, 'Print Size (300dpi)', this.calculatePrintSize());

    // Try to load EXIF data
    await this.loadExifData(contentEl);
  }

  private addInfoRow(container: HTMLElement, label: string, value: string): void {
    const row = container.createDiv({ cls: 'image-viewer-info-row' });
    row.createDiv({ cls: 'image-viewer-info-label', text: label + ':' });
    row.createDiv({ cls: 'image-viewer-info-value', text: value });
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  private calculateMegapixels(): string {
    const mp = (this.dimensions.width * this.dimensions.height) / 1000000;
    return mp.toFixed(2) + ' MP';
  }

  private calculatePrintSize(): string {
    const widthInch = (this.dimensions.width / 300).toFixed(1);
    const heightInch = (this.dimensions.height / 300).toFixed(1);
    return `${widthInch} × ${heightInch} inches`;
  }

  private async loadExifData(container: HTMLElement): Promise<void> {
    try {
      // Read the file as a File object
      const file = await this.app.vault.readBinary(this.image.file);
      const blob = new Blob([file], { type: `image/${this.image.extension}` });
      const fileObj = new File([blob], this.image.name);

      this.exifData = await ExifParser.parse(fileObj);

      if (this.hasExifData()) {
        container.createEl('h3', { text: '📷 EXIF Information' });

        if (this.exifData!.make || this.exifData!.model) {
          this.addInfoRow(container, 'Camera',
            `${this.exifData!.make || ''} ${this.exifData!.model || ''}`.trim());
        }

        if (this.exifData!.exposureTime) {
          this.addInfoRow(container, 'Shutter Speed', this.exifData!.exposureTime + 's');
        }

        if (this.exifData!.fNumber) {
          this.addInfoRow(container, 'Aperture', 'f/' + this.exifData!.fNumber.toFixed(1));
        }

        if (this.exifData!.iso) {
          this.addInfoRow(container, 'ISO', this.exifData!.iso.toString());
        }

        if (this.exifData!.focalLength) {
          this.addInfoRow(container, 'Focal Length', this.exifData!.focalLength + 'mm');
        }

        if (this.exifData!.dateTime) {
          this.addInfoRow(container, 'Date Taken', this.formatExifDate(this.exifData!.dateTime));
        }

        if (this.exifData!.gpsLatitude && this.exifData!.gpsLongitude) {
          const locationLink = container.createDiv({ cls: 'image-viewer-info-row' });
          locationLink.createDiv({ cls: 'image-viewer-info-label', text: 'Location:' });
          const link = locationLink.createDiv({ cls: 'image-viewer-info-value' })
            .createEl('a', { text: 'View on Map' });
          link.href = `https://maps.google.com/?q=${this.exifData!.gpsLatitude},${this.exifData!.gpsLongitude}`;
          link.target = '_blank';
        }
      }
    } catch (error) {
      console.error('Failed to load EXIF data:', error);
    }
  }

  private hasExifData(): boolean {
    if (!this.exifData) return false;
    return !!(
      this.exifData.make ||
      this.exifData.model ||
      this.exifData.exposureTime ||
      this.exifData.fNumber ||
      this.exifData.iso ||
      this.exifData.focalLength ||
      this.exifData.dateTime ||
      this.exifData.gpsLatitude
    );
  }

  private formatExifDate(dateStr: string): string {
    // EXIF date format: YYYY:MM:DD HH:mm:ss
    const parts = dateStr.split(' ');
    if (parts.length === 2) {
      const dateParts = parts[0].split(':');
      if (dateParts.length === 3) {
        return `${dateParts[0]}-${dateParts[1]}-${dateParts[2]} ${parts[1]}`;
      }
    }
    return dateStr;
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
