# Obsidian Image Viewer 插件设计文档

参考 [PicView](https://picview.org/) 设计的 Obsidian 图片查看器插件。

## 什么是 PicView？

[PicView](https://picview.org/) 是一款快速、免费且完全可定制的图片查看器，支持 Windows 10/11 和 macOS。它支持几乎所有图片格式，包括 WEBP、GIF、SVG、AVIF、HEIC、PSD 等。

## 功能概述

为 Obsidian 设计一个类似的图片浏览器，支持浏览指定文件夹下的所有图片，提供流畅的查看体验。

## 核心功能

### 1. 文件夹图片浏览

- 选择任意文件夹查看其中的图片
- 自动扫描子文件夹（可配置）
- 支持的图片格式

| 常用格式 | Photoshop/Apple | 相机 RAW | 其他 |
|----------|-----------------|----------|------|
| jpg, jpeg, png | psd, psb | 3fr, arw, cr2, cr3 | svg, ico, tiff |
| gif, webp, bmp | heic, heif | dng, nef, raw | tga, dds, jp2 |
| avif, jxl | xcf, hdr | rw2, srf, x3f | exr, ppm, pgm |

### 2. 图片导航

| 快捷键 | 功能 |
|--------|------|
| `←` / `A` | 上一张 |
| `→` / `D` | 下一张 |
| `Home` / `Ctrl + ←` | 第一张 |
| `End` / `Ctrl + →` | 最后一张 |
| `Shift + ←` | 上一个文件夹 |
| `Shift + →` | 下一个文件夹 |

### 3. 缩放与平移

| 快捷键 | 功能 |
|--------|------|
| `+` / `Ctrl + 滚轮` | 放大（以光标位置为中心） |
| `-` / `Ctrl + 滚轮` | 缩小 |
| `R` / 双击 | 重置缩放 |
| `X` / `Scroll Lock` | 切换滚动模式 |
| 滚轮 | 翻页 / 滚动图片（可配置） |

### 4. 缩略图画廊

- 按 `G` 打开/关闭画廊视图
- 平滑动画过渡
- 支持键盘导航（WASD 或方向键）
- 按 `Enter` 或 `E` 加载选中图片
- 右键缩略图显示上下文菜单

### 5. 图片信息

按 `I` 显示图片信息窗口：

- **文件信息**：文件名、大小、路径
- **打印尺寸**：英寸/厘米
- **像素信息**：分辨率、兆像素
- **EXIF 信息**：拍摄日期、相机型号、GPS 位置等

### 6. 全屏模式

| 快捷键 | 功能 |
|--------|------|
| `F11` / `Alt + Enter` | 切换全屏 |
| `Alt + Z` | 显示/隐藏 UI |
| `Space` | 居中窗口 |

### 7. 幻灯片播放

| 快捷键 | 功能 |
|--------|------|
| `F5` | 开始/停止幻灯片 |
| `L` | 切换循环播放 |

配置选项：
- 播放间隔时间
- 循环播放
- 随机播放

### 8. 图片编辑

| 快捷键 | 功能 |
|--------|------|
| `W` | 顺时针旋转 |
| `S` | 逆时针旋转 |
| `F` | 水平翻转 |
| `C` | 裁剪（按住 Shift 为正方形选区） |

### 9. 文件操作

| 快捷键 | 功能 |
|--------|------|
| `F2` | 重命名/移动文件 |
| `Del` | 移至回收站 |
| `Shift + Del` | 永久删除 |
| `Ctrl + C` | 复制图片/复制裁剪区域 |
| `Ctrl + Shift + C` | 复制文件 |
| `Ctrl + V` | 粘贴 |

## 界面设计

### 主界面

```
┌─────────────────────────────────────────────────────────────┐
│  [图片名.jpg]                    [最小化] [全屏] [关闭]       │
├─────────────────────────────────────────────────────────────┤
│  工具栏 (Alt+Z 切换显示)                                     │
│  [← 上一张] [→ 下一张] [1/24] [100%] [旋转] [画廊] [设置]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     <                                                       │
│                       [主图片显示区域]                        │
│                       支持拖拽、缩放、平移                     │
│                                                             │
│                                                 >           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  悬浮信息栏 (可选显示)                                       │
│  文件名: image.jpg | 1920x1080 | 2.1 MB | 2024-01-15        │
└─────────────────────────────────────────────────────────────┘
```

### 画廊视图（按 G）

```
┌─────────────────────────────────────────────────────────────┐
│  [图片名.jpg]                    [最小化] [全屏] [关闭]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│     │     │ │     │ │     │ │     │ │     │ │     │        │
│     │  1  │ │  2  │ │  3  │ │  4  │ │  5  │ │  6  │        │
│     │     │ │     │ │     │ │     │ │     │ │     │        │
│     └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
│     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│     │     │ │     │ │     │ │     │ │     │ │     │        │
│     │  7  │ │  8  │ │  9  │ │ 10  │ │ 11  │ │ 12  │        │
│     │     │ │     │ │     │ │     │ │     │ │     │        │
│     └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
│                                                             │
│                   使用 WASD 或方向键导航                      │
│                   Enter 或 E 加载选中图片                     │
└─────────────────────────────────────────────────────────────┘
```

### 图片信息窗口（按 I）

```
┌─────────────────────────────────────┐
│  图片信息                      [×]  │
├─────────────────────────────────────┤
│  📁 文件信息                        │
│     文件名: image.jpg               │
│     路径: /assets/images/           │
│     大小: 2.1 MB                    │
│     创建: 2024-01-15 10:30          │
│     修改: 2024-01-15 14:22          │
├─────────────────────────────────────┤
│  📐 尺寸信息                        │
│     分辨率: 1920 × 1080             │
│     兆像素: 2.07 MP                 │
│     打印尺寸: 6.4 × 3.6 英寸 (300dpi)│
├─────────────────────────────────────┤
│  📷 EXIF 信息                       │
│     相机: Canon EOS R5              │
│     镜头: RF 24-70mm F2.8 L         │
│     快门: 1/250s                    │
│     光圈: f/2.8                     │
│     ISO: 400                        │
│     焦距: 50mm                      │
│     拍摄时间: 2024-01-15 10:30:00   │
│     [📍 在地图中查看]               │
├─────────────────────────────────────┤
│  ⭐ 评分: ☆ ☆ ☆ ☆ ☆               │
│  [优化图片] [调整大小]              │
└─────────────────────────────────────┘
```

## 设置选项

```typescript
interface ImageViewerSettings {
  // 显示设置
  theme: 'light' | 'dark' | 'system';
  backgroundColor: string;
  showToolbar: boolean;
  showImageInfo: boolean;
  showFilePath: boolean;

  // 缩略图画廊
  thumbnailSize: number;           // 缩略图大小 (px)
  galleryColumns: number;          // 画廊列数

  // 导航设置
  scrollBehavior: 'navigate' | 'scroll';  // 滚轮行为
  loopImages: boolean;             // 循环浏览
  sortby: 'name' | 'size' | 'date' | 'random';
  sortAscending: boolean;

  // 幻灯片设置
  slideshowInterval: number;       // 间隔（秒）
  slideshowLoop: boolean;
  slideshowRandom: boolean;

  // 缩放设置
  zoomStep: number;                // 缩放步进
  defaultZoomMode: 'fit' | 'fill' | 'actual';

  // 文件夹设置
  defaultFolder: string;
  scanSubfolders: boolean;
  imageExtensions: string[];
}
```

## 默认设置

```typescript
const DEFAULT_SETTINGS: ImageViewerSettings = {
  theme: 'dark',
  backgroundColor: '#1a1a1a',
  showToolbar: true,
  showImageInfo: false,
  showFilePath: true,

  thumbnailSize: 120,
  galleryColumns: 6,

  scrollBehavior: 'navigate',
  loopImages: true,
  sortby: 'name',
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
```

## 快捷键汇总

| 快捷键 | 功能 | 分类 |
|--------|------|------|
| `Esc` | 关闭窗口/菜单 | 导航 |
| `←` / `A` | 上一张 | 导航 |
| `→` / `D` | 下一张 | 导航 |
| `Home` | 第一张 | 导航 |
| `End` | 最后一张 | 导航 |
| `G` | 切换画廊视图 | 视图 |
| `I` | 显示图片信息 | 视图 |
| `Alt + Z` | 显示/隐藏 UI | 视图 |
| `F11` | 全屏 | 视图 |
| `+` | 放大 | 缩放 |
| `-` | 缩小 | 缩放 |
| `R` | 重置缩放 | 缩放 |
| `X` | 切换滚动模式 | 缩放 |
| `W` | 顺时针旋转 | 编辑 |
| `S` | 逆时针旋转 | 编辑 |
| `F` | 水平翻转 | 编辑 |
| `C` | 裁剪 | 编辑 |
| `F2` | 重命名 | 文件 |
| `Del` | 删除 | 文件 |
| `F5` | 幻灯片 | 播放 |
| `L` | 循环切换 | 播放 |
| `F4` | 设置 | 其他 |
| `K` | 快捷键帮助 | 其他 |
| `B` | 切换背景色 | 其他 |

## 文件结构

```
obsidian-image-viewer/
├── main.ts                 # 插件入口
├── manifest.json           # 插件配置
├── styles.css              # 样式文件
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── src/
    ├── settings.ts         # 设置页面
    ├── types.ts            # 类型定义
    ├── viewer/
    │   ├── ImageView.ts    # 主视图
    │   ├── ImageCanvas.ts  # 图片画布
    │   ├── Gallery.ts      # 画廊视图
    │   ├── ImageInfo.ts    # 图片信息
    │   ├── Toolbar.ts      # 工具栏
    │   └── CropModal.ts    # 裁剪模态框
    └── utils/
        ├── imageLoader.ts  # 图片加载
        ├── exif.ts         # EXIF 解析
        ├── zoom.ts         # 缩放管理
        └── keyboard.ts     # 键盘处理
```

## 命令列表

| 命令 | 说明 |
|------|------|
| `打开图片浏览器` | 打开默认文件夹 |
| `打开指定文件夹...` | 选择文件夹浏览 |
| `浏览当前图片所在文件夹` | 右键菜单触发 |

## 与 Obsidian 集成

### 1. Ribbon 图标

```typescript
this.addRibbonIcon('image', '图片浏览器', () => {
  this.openImageViewer(this.settings.defaultFolder);
});
```

### 2. 命令注册

```typescript
this.addCommand({
  id: 'open-image-viewer',
  name: '打开图片浏览器',
  callback: () => this.openImageViewer()
});

this.addCommand({
  id: 'open-folder',
  name: '打开指定文件夹',
  callback: () => this.showFolderPicker()
});
```

### 3. 右键菜单

```typescript
this.registerEvent(
  this.app.workspace.on('file-menu', (menu, file) => {
    if (file instanceof TFolder) {
      menu.addItem(item => {
        item.setTitle('在图片浏览器中打开')
            .setIcon('image')
            .onClick(() => this.openImageViewer(file.path));
      });
    } else if (this.isImageFile(file)) {
      menu.addItem(item => {
        item.setTitle('在图片浏览器中打开')
            .setIcon('image')
            .onClick(() => this.openImageViewer(file.parent.path, file.path));
      });
    }
  })
);
```

## 后续扩展功能

1. **批量操作**
   - 批量调整大小
   - 批量格式转换
   - 批量压缩

2. **图片效果**
   - 亮度/对比度调整
   - 滤镜效果
   - 色彩调整

3. **高级功能**
   - 图片对比（并排显示）
   - 收藏/标记功能
   - 拖拽排序
   - 压缩包内图片浏览

## 参考资料

- [PicView 官网](https://picview.org/)
- [Obsidian API 文档](https://docs.obsidian.md/Reference/TypeScript+API)
