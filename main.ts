import { Plugin, TFolder, TFile, Notice, FuzzySuggestModal } from 'obsidian';
import { ImageView, VIEW_TYPE_IMAGE_VIEWER } from './src/viewer/ImageView';
import { ImageViewerSettingTab } from './src/settings';
import { DEFAULT_SETTINGS, type ImageViewerSettings } from './src/types';

export default class ImageViewerPlugin extends Plugin {
  settings: ImageViewerSettings;
  private view: ImageView | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register view
    this.registerView(VIEW_TYPE_IMAGE_VIEWER, (leaf) => {
      this.view = new ImageView(leaf, this);
      return this.view;
    });

    // Ribbon icon
    this.addRibbonIcon('image', 'Image Viewer', () => {
      this.openImageViewer(this.settings.defaultFolder);
    });

    // Commands
    this.addCommand({
      id: 'open-image-viewer',
      name: 'Open Image Viewer',
      callback: () => this.openImageViewer(this.settings.defaultFolder)
    });

    this.addCommand({
      id: 'open-folder',
      name: 'Open folder...',
      callback: () => this.showFolderPicker()
    });

    this.addCommand({
      id: 'open-current-folder',
      name: 'Browse current folder',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (file && file.parent) {
          if (!checking) {
            this.openImageViewer(file.parent.path);
          }
          return true;
        }
        return false;
      }
    });

    // File menu
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Open in Image Viewer')
              .setIcon('image')
              .onClick(() => this.openImageViewer(file.path));
          });
        } else if (file instanceof TFile && this.isImageFile(file) && file.parent) {
          menu.addItem((item) => {
            item
              .setTitle('Open in Image Viewer')
              .setIcon('image')
              .onClick(() => this.openImageViewer(file.parent!.path, file.path));
          });
        }
      })
    );

    // Settings tab
    this.addSettingTab(new ImageViewerSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    if (this.view) {
      this.view.updateSettings(this.settings);
    }
  }

  isImageFile(file: TFile): boolean {
    const ext = file.extension.toLowerCase();
    return this.settings.imageExtensions.includes(ext);
  }

  async openImageViewer(folderPath: string, initialImage?: string): Promise<void> {
    // Check if folder exists
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !(folder instanceof TFolder)) {
      new Notice(`Folder not found: ${folderPath}`);
      return;
    }

    // Detach existing view if any
    const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_IMAGE_VIEWER);
    if (existingLeaf.length > 0) {
      existingLeaf[0].detach();
    }

    // Create new view
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({
      type: VIEW_TYPE_IMAGE_VIEWER,
      active: true
    });

    // Get view from leaf and load folder
    const view = leaf.view as ImageView;
    await view.loadFolder(folderPath, initialImage);
    this.view = view;
  }

  async showFolderPicker(): Promise<void> {
    const folders = this.getAllFolders(this.app.vault.getRoot());

    const modal = new FolderSuggestModal(this.app, folders, (folder) => {
      this.openImageViewer(folder.path);
    });
    modal.open();
  }

  private getAllFolders(folder: TFolder): TFolder[] {
    const folders: TFolder[] = [folder];
    for (const child of folder.children) {
      if (child instanceof TFolder) {
        folders.push(...this.getAllFolders(child));
      }
    }
    return folders;
  }

  onunload(): void {
    this.view = null;
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_IMAGE_VIEWER);
  }
}

class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
  private folders: TFolder[];
  private onChoose: (folder: TFolder) => void;

  constructor(app: any, folders: TFolder[], onChoose: (folder: TFolder) => void) {
    super(app);
    this.folders = folders;
    this.onChoose = onChoose;
  }

  getItems(): TFolder[] {
    return this.folders;
  }

  getItemText(folder: TFolder): string {
    return folder.path;
  }

  onChooseItem(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
    this.onChoose(folder);
  }
}
