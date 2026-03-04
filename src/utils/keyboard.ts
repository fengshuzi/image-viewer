import type { ImageViewerSettings } from '../types';

export interface KeyboardHandler {
  (event: KeyboardEvent): void;
}

export class KeyboardManager {
  private settings: ImageViewerSettings;
  private handlers: Map<string, KeyboardHandler> = new Map();

  constructor(settings: ImageViewerSettings) {
    this.settings = settings;
  }

  updateSettings(settings: ImageViewerSettings): void {
    this.settings = settings;
  }

  register(key: string, handler: KeyboardHandler): void {
    this.handlers.set(key.toLowerCase(), handler);
  }

  unregister(key: string): void {
    this.handlers.delete(key.toLowerCase());
  }

  handle(event: KeyboardEvent): boolean {
    const key = this.getNormalizedKey(event);
    const handler = this.handlers.get(key);

    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
      return true;
    }

    return false;
  }

  private getNormalizedKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');

    // Normalize key names
    let key = event.key.toLowerCase();
    if (key === 'arrowleft') key = 'left';
    else if (key === 'arrowright') key = 'right';
    else if (key === 'arrowup') key = 'up';
    else if (key === 'arrowdown') key = 'down';

    parts.push(key);

    return parts.join('+');
  }

  // Standard key bindings
  static readonly KEYS = {
    // Navigation
    PREV: 'left',
    PREV_ALT: 'a',
    NEXT: 'right',
    NEXT_ALT: 'd',
    FIRST: 'home',
    FIRST_ALT: 'ctrl+left',
    LAST: 'end',
    LAST_ALT: 'ctrl+right',
    PREV_FOLDER: 'shift+left',
    NEXT_FOLDER: 'shift+right',

    // View
    TOGGLE_GALLERY: 'g',
    TOGGLE_INFO: 'i',
    TOGGLE_UI: 'alt+z',
    FULLSCREEN: 'f11',
    FULLSCREEN_ALT: 'alt+enter',
    ESCAPE: 'escape',

    // Zoom
    ZOOM_IN: '+',
    ZOOM_IN_ALT: '=',
    ZOOM_OUT: '-',
    RESET_ZOOM: 'r',
    TOGGLE_SCROLL_MODE: 'x',

    // Edit
    ROTATE_CW: ']',
    ROTATE_CCW: '[',
    FLIP_H: 'f',
    CROP: 'c',

    // File
    RENAME: 'f2',
    DELETE: 'delete',
    DELETE_PERMANENT: 'shift+delete',
    COPY: 'ctrl+c',
    COPY_FILE: 'ctrl+shift+c',
    PASTE: 'ctrl+v',

    // Slideshow
    TOGGLE_SLIDESHOW: 'f5',
    TOGGLE_LOOP: 'l',

    // Other
    SETTINGS: 'f4',
    HELP: 'k',
    TOGGLE_BG: 'b'
  };
}
