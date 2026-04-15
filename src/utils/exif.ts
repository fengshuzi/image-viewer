import type { ExifData } from '../types';

interface ExifParseResult extends ExifData {
  exifIFDOffset?: number;
}

export class ExifParser {
  static async parse(file: File): Promise<ExifData> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const dataView = new DataView(e.target?.result as ArrayBuffer);
          const exifData = this.parseExifData(dataView);
          resolve(exifData);
        } catch {
          resolve({});
        }
      };

      reader.onerror = () => resolve({});
      reader.readAsArrayBuffer(file.slice(0, 65536)); // Read first 64KB for EXIF
    });
  }

  private static parseExifData(dataView: DataView): ExifData {
    const result: ExifParseResult = {};

    // Check for JPEG SOI marker
    if (dataView.getUint16(0, false) !== 0xFFD8) {
      return result;
    }

    let offset = 2;
    const length = dataView.byteLength;

    while (offset < length) {
      // Check for APP1 marker (EXIF)
      if (dataView.getUint16(offset, false) === 0xFFE1) {
        const exifHeader = offset + 4;
        const tiffOffset = exifHeader + 6;

        // Check for "Exif\0\0"
        if (this.getString(dataView, exifHeader, 6) === 'Exif\x00\x00') {
          const littleEndian = dataView.getUint16(tiffOffset, false) === 0x4949;

          // Parse IFD0
          const ifd0Offset = tiffOffset + dataView.getUint32(tiffOffset + 4, littleEndian);
          this.parseIFD(dataView, ifd0Offset, littleEndian, result);

          // Parse ExifIFD if exists
          const exifIFDOffset = result.exifIFDOffset;
          if (exifIFDOffset) {
            this.parseExifIFD(dataView, exifIFDOffset, littleEndian, result);
            delete result.exifIFDOffset;
          }
        }
        break;
      }
      offset += 2 + dataView.getUint16(offset + 2, false);
    }

    return result;
  }

  private static parseIFD(
    dataView: DataView,
    offset: number,
    littleEndian: boolean,
    result: ExifParseResult
  ): void {
    const count = dataView.getUint16(offset, littleEndian);

    for (let i = 0; i < count; i++) {
      const entryOffset = offset + 2 + i * 12;
      const tag = dataView.getUint16(entryOffset, littleEndian);
      const type = dataView.getUint16(entryOffset + 2, littleEndian);
      const valueOffset = entryOffset + 8;

      switch (tag) {
        case 0x010F: // Make
          result.make = this.getStringValue(dataView, valueOffset, type, littleEndian);
          break;
        case 0x0110: // Model
          result.model = this.getStringValue(dataView, valueOffset, type, littleEndian);
          break;
        case 0x011A: // XResolution
        case 0x011B: // YResolution
          // Skip for now
          break;
        case 0x8769: // ExifIFD
          result.exifIFDOffset = dataView.getUint32(valueOffset, littleEndian);
          break;
      }
    }
  }

  private static parseExifIFD(
    dataView: DataView,
    offset: number,
    littleEndian: boolean,
    result: ExifData
  ): void {
    const count = dataView.getUint16(offset, littleEndian);

    for (let i = 0; i < count; i++) {
      const entryOffset = offset + 2 + i * 12;
      const tag = dataView.getUint16(entryOffset, littleEndian);
      const type = dataView.getUint16(entryOffset + 2, littleEndian);
      const valueOffset = entryOffset + 8;

      switch (tag) {
        case 0x829A: // ExposureTime
          result.exposureTime = this.getRationalValue(dataView, valueOffset, littleEndian);
          break;
        case 0x829D: { // FNumber
          const fNumber = this.getRationalNumber(dataView, valueOffset, littleEndian);
          if (fNumber) result.fNumber = fNumber;
          break;
        }
        case 0x8827: // ISOSpeedRatings
          result.iso = dataView.getUint16(valueOffset, littleEndian);
          break;
        case 0x9003: // DateTimeOriginal
          result.dateTime = this.getStringValue(dataView, valueOffset, type, littleEndian);
          break;
        case 0x920A: // FocalLength
          result.focalLength = this.getRationalValue(dataView, valueOffset, littleEndian);
          break;
        case 0xA002: // ExifImageWidth
          result.width = dataView.getUint16(valueOffset, littleEndian);
          break;
        case 0xA003: // ExifImageHeight
          result.height = dataView.getUint16(valueOffset, littleEndian);
          break;
      }
    }
  }

  private static getString(dataView: DataView, offset: number, length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
      const char = dataView.getUint8(offset + i);
      if (char === 0) break;
      str += String.fromCharCode(char);
    }
    return str;
  }

  private static getStringValue(
    dataView: DataView,
    offset: number,
    type: number,
    littleEndian: boolean
  ): string {
    if (type === 2) { // ASCII
      return this.getString(dataView, offset, 32);
    }
    return '';
  }

  private static getRationalValue(
    dataView: DataView,
    offset: number,
    littleEndian: boolean
  ): string {
    const numerator = dataView.getUint32(offset, littleEndian);
    const denominator = dataView.getUint32(offset + 4, littleEndian);
    if (denominator === 0) return '0';
    if (denominator === 1) return `${numerator}`;
    return `${numerator}/${denominator}`;
  }

  private static getRationalNumber(
    dataView: DataView,
    offset: number,
    littleEndian: boolean
  ): number | null {
    const numerator = dataView.getUint32(offset, littleEndian);
    const denominator = dataView.getUint32(offset + 4, littleEndian);
    if (denominator === 0) return null;
    return numerator / denominator;
  }
}
