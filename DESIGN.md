# Obsidian Image Viewer 插件设计文档

参考 [PicView](https://picview.org/) 设计的 Obsidian 图片查看器插件，用于在 Obsidian 中浏览文件夹图片。

## 插件结构

```
image-viewer/
├── main.ts                      # 插件入口：注册视图、命令、菜单、设置页
├── manifest.json
├── package.json
├── styles.css                   # 查看器与设置页样式
├── esbuild.config.mjs
├── release.mjs
├── version-bump.mjs
├── src/
│   ├── settings.ts              # 设置页面 UI
│   ├── types.ts                 # 类型定义与默认设置
│   ├── viewer/
│   │   ├── ImageView.ts         # 主视图：容器布局、状态、快捷键、文件操作
│   │   ├── ImageCanvas.ts       # 图片渲染、缩放、平移、旋转、滚轮处理
│   │   ├── Gallery.ts           # 底部缩略图画廊（虚拟渲染）
│   │   ├── Toolbar.ts           # 底部浮层工具栏
│   │   ├── InfoPanel.ts         # 右侧图片信息面板（含反向链接）
│   │   └── CropModal.ts         # 裁剪图片模态框
│   └── utils/
│       ├── imageLoader.ts       # 加载/发现图片、文件夹扫描
│       ├── zoom.ts              # 缩放状态管理
│       ├── keyboard.ts          # 快捷键管理
│       └── exif.ts              # EXIF 元数据解析
```

## 主视图布局

DOM 顺序由 `ImageView.onOpen()` 构建：

```
.image-viewer-container
└── .image-viewer-main
    └── .image-viewer-image-container          (flex row, 占满剩余空间)
        ├── .image-viewer-nav-arrow-container  (左，上一页按钮)
        ├── .image-viewer-canvas-wrapper        (图片，接收滚轮/拖拽)
        │   ├── <img class="image-viewer-canvas">
        │   ├── .image-viewer-toolbar-container   (fixed 定位，视口底部)
        │   └── .image-viewer-info-bar            (底部文件名浮层)
        └── .image-viewer-nav-arrow-container  (右，下一页按钮)

.image-viewer-gallery-strip                    (fixed 定位，视口底部工具栏上方)

.image-viewer-info-panel-wrapper               (侧栏，宽度 0/300px)
```

## 定位约定

| 元素 | 定位 | 关键约束 |
|---|---|---|
| 上一页 / 下一页按钮 | 普通 flex item | 位于图片两侧，不能在图片上叠加，避免被浅色图片覆盖 |
| 工具栏 | `position: fixed; bottom: 24px; z-index: 200` | 锚定视口底部，不随图片缩放/平移移动 |
| 画廊 | `position: fixed; bottom: 88px; z-index: 190` | 位于工具栏上方，通过 `height` + `opacity` 显隐，不能推开工具栏 |
| 信息面板 | 普通 flex item，宽度 0/300px | 从右侧展开，压缩画布区域 |
| 状态栏隐藏 | `body.image-viewer-active` / `.image-viewer-leaf` | 查看器打开时隐藏 Obsidian 状态栏和反向链接区 |

修改 `styles.css` 时，必须在「未展开画廊」「展开画廊」「图片放大/平移」「窗口缩放」四种场景下验证布局稳定性。

## 设置项

完整设置结构见 `src/types.ts`：`ImageViewerSettings`。

主要配置项：

- **Folders**（设置页第一项）
  - `folderMode`: `"auto"` 自动发现图片文件夹，`"manual"` 使用指定路径
  - `defaultFolders`: 手动模式下的多个文件夹路径，逗号分隔
  - `excludeFolders`: 自动发现时排除的文件夹，逗号分隔
  - `scanSubfolders`: 是否扫描子文件夹
  - `imageExtensions`: 识别的图片扩展名列表
- **Display**
  - `theme`: `light` / `dark` / `system`
  - `backgroundColor`: 自定义背景色
  - `showToolbar`: 是否默认显示工具栏
  - `showFilePath`: 是否显示文件路径
- **Gallery**
  - `thumbnailSize`: 缩略图尺寸
  - `galleryColumns`: 画廊列数
- **Navigation**
  - `scrollBehavior`: 滚轮翻页或滚动图片
  - `loopImages`: 循环浏览
  - `sortBy`: 排序方式
  - `sortAscending`: 升序/降序
- **Slideshow**
  - `slideshowInterval`: 播放间隔
  - `slideshowLoop`: 循环播放
  - `slideshowRandom`: 随机播放
- **Zoom**
  - `zoomStep`: 缩放步进
  - `defaultZoomMode`: 初始缩放模式 `fit` / `fill` / `actual`

## 快捷键

| 快捷键 | 功能 |
|---|---|
| `←` / `A` | 上一张 |
| `→` / `D` | 下一张 |
| `Home` | 第一张 |
| `End` | 最后一张 |
| `G` | 切换画廊 |
| `I` | 切换信息面板 |
| `Alt + Z` | 显示/隐藏 UI |
| `F11` | 全屏 |
| `+` / `-` | 放大/缩小 |
| `R` | 重置缩放 |
| `X` | 切换滚动模式 |
| `]` / `[` | 顺时针/逆时针旋转 |
| `F` | 水平翻转 |
| `C` | 裁剪 |
| `F2` | 重命名 |
| `Del` | 移到回收站 |
| `Shift + Del` | 永久删除 |
| `F5` | 幻灯片 |
| `L` | 循环切换 |
| `Esc` | 关闭/取消面板 |

## 状态持久化

`ImageView.getState()` / `setState()` 保存当前文件夹与图片路径，Obsidian 刷新后自动恢复查看位置。

## 样式设计

`styles.css` 采用 Apple 设计语言：

- 深色背景 `var(--iv-ink)` 为 `#1d1d1f`
- 操作蓝 `var(--iv-action)` 为 `#0066cc`
- 工具栏/画廊使用半透明毛玻璃效果 `backdrop-filter: blur(20px)`
- 圆角使用 `8px` / `18px` / 胶囊形 `9999px`
- 主图使用轻微投影 `rgba(0, 0, 0, 0.22) 3px 5px 30px`

## 构建与发布

```bash
npm run dev      # 监听构建
npm run build    # 类型检查 + 生产构建
npm run deploy   # 部署到本地 vault
npm run release  # 构建 + 创建 GitHub Release
```

生产产物输出到 `dist/`，包含 `main.js`、`manifest.json`、`styles.css`、`assets/wechat-donate.jpg`。

## 开发注意事项

- 使用 Obsidian 推荐的 `window.requestAnimationFrame`、`window.setTimeout`、`activeDocument` 保证 popout 窗口兼容。
- 文件删除使用 `app.fileManager.trashFile()` 以尊重用户设置。
- 避免使用 `@ts-expect-error`，优先显式类型断言。
- 不要修改无关代码；改动需保持与现有代码风格一致。
- 文档与代码不一致时，以代码为准更新本文档。
