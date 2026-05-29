# Image Viewer - Obsidian Plugin

A powerful image viewer for Obsidian with gallery view, zoom, slideshow, EXIF display, and more. Inspired by [PicView](https://picview.org/).

## Features

### Image Browsing
- Browse images in any vault folder with arrow keys or mouse
- Support for 16+ formats: JPG, PNG, GIF, WebP, SVG, AVIF, HEIC, PSD, RAW, etc.
- Thumbnail strip at the bottom for quick navigation
- Configurable subfolder scanning and default folder

### Zoom & Pan
- Zoom in/out with `+`/`-` keys or mouse wheel
- Drag to pan when zoomed in
- Zoom modes: fit to window, fill window, actual size
- Two scroll modes: navigate between images, or zoom/pan within image

### Gallery View
- Grid gallery with configurable thumbnail size (60–200px) and columns (3–12)
- Smooth show/hide animations

### Slideshow
- Configurable interval (1–30 seconds)
- Loop and random order options

### Image Editing
- Rotate clockwise/counter-clockwise
- Flip horizontal
- Crop

### EXIF & File Info
- Display camera info, GPS coordinates, exposure settings
- File name, path, size, dimensions, dates

### File Operations
- Rename (F2)
- Move to trash (Delete)
- Permanent delete (Shift+Delete)

## Installation

### From Obsidian Community Plugins (Recommended)

Open Obsidian Settings → Community Plugins → Browse, and search for **Image Viewer** or **fengshuzi** to install directly.


### From GitHub Release

1. Go to [Releases](../../releases) and download `main.js`, `manifest.json`, and `styles.css`
2. Create folder `.obsidian/plugins/image-viewer/` in your vault
3. Copy the downloaded files into it
4. Restart Obsidian and enable the plugin in settings

### Manual Build

```bash
cd /path/to/your/vault/.obsidian/plugins
git clone https://github.com/fengshuzi/image-viewer.git
cd image-viewer
npm install
npm run build
```

## Usage

Open the image viewer from the command palette or ribbon icon, then browse images in your configured folder.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` or `A` / `D` | Previous / Next image |
| `Home` / `End` | First / Last image |
| `+` / `-` | Zoom in / out |
| `R` | Reset zoom |
| `Scroll Lock` | Toggle scroll mode (navigate vs. zoom) |
| `]` / `[` | Rotate CW / CCW |
| `F` | Flip horizontal |
| `C` | Crop |
| `G` | Toggle gallery view |
| `I` | Toggle info panel |
| `F5` | Toggle slideshow |
| `L` | Toggle loop |
| `F11` | Fullscreen |
| `Alt+Z` | Hide/show UI |
| `F2` | Rename file |
| `Delete` | Move to trash |
| `Shift+Delete` | Delete permanently |
| `?` | Show help |

## Settings

- **Theme**: dark / light / system
- **Background color**
- **Gallery**: thumbnail size, columns
- **Navigation**: scroll behavior, loop, sort order (name/date/size/random)
- **Slideshow**: interval, loop, random
- **Zoom**: step size, default mode
- **Folder**: default folder, subfolder scanning

## Development

```bash
npm run dev      # Watch mode with sourcemaps
npm run build    # Production build
npm run deploy   # Build + copy to vaults
npm run release  # Build + git tag + GitHub Release
```

## License

MIT

---

## ☕ Support the Author

If this plugin helps you, consider buying the author a coffee!

<div align="center">
  <img src="./assets/wechat-donate.jpg" alt="WeChat Donate" width="200" />
  <p><sub>WeChat</sub></p>
</div>
