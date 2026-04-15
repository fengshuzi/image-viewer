// Type definitions for Image Viewer plugin

import type { TFile } from 'obsidian';

export interface ImageViewerSettings {
  // Display settings
  theme: 'light' | 'dark' | 'system';
  backgroundColor: string;
  showToolbar: boolean;
  showImageInfo: boolean;
  showFilePath: boolean;

  // Thumbnail gallery
  thumbnailSize: number;
  galleryColumns: number;

  // Navigation settings
  scrollBehavior: 'navigate' | 'scroll';
  loopImages: boolean;
  sortBy: 'name' | 'size' | 'date' | 'random';
  sortAscending: boolean;

  // Slideshow settings
  slideshowInterval: number;
  slideshowLoop: boolean;
  slideshowRandom: boolean;

  // Zoom settings
  zoomStep: number;
  defaultZoomMode: 'fit' | 'fill' | 'actual';

  // Folder settings
  defaultFolder: string;
  scanSubfolders: boolean;
  imageExtensions: string[];
}

export const DEFAULT_SETTINGS: ImageViewerSettings = {
  theme: 'dark',
  backgroundColor: '#1a1a1a',
  showToolbar: true,
  showImageInfo: false,
  showFilePath: true,

  thumbnailSize: 120,
  galleryColumns: 6,

  scrollBehavior: 'navigate',
  loopImages: true,
  sortBy: 'name',
  sortAscending: true,

  slideshowInterval: 3,
  slideshowLoop: true,
  slideshowRandom: false,

  zoomStep: 0.25,
  defaultZoomMode: 'fit',

  defaultFolder: 'assets',
  scanSubfolders: false,
  imageExtensions: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'ico',
    'svg', 'avif', 'heic', 'heif', 'psd', 'raw', 'cr2', 'nef'
  ]
};

export interface ImageFile {
  file: TFile;
  path: string;
  name: string;
  extension: string;
  size: number;
  ctime: number;
  mtime: number;
}

export interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  width?: number;
  height?: number;
}

export interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}
