import { Plugin, TFolder, TFile, Notice, FuzzySuggestModal, App } from 'obsidian';
import { ImageView, VIEW_TYPE_IMAGE_VIEWER } from './src/viewer/ImageView';
import { ImageViewerSettingTab } from './src/settings';
import { DEFAULT_SETTINGS, type ImageViewerSettings } from './src/types';

export default class ImageViewerPlugin extends Plugin {
  settings: ImageViewerSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register view
    this.registerView(VIEW_TYPE_IMAGE_VIEWER, (leaf) => {
      return new ImageView(leaf, this) as unknown as import('obsidian').View;
    });

    // Ribbon icon
    this.addRibbonIcon('image', 'Open image viewer', () => {
      void this.openImageViewer(this.settings.defaultFolder);
    });

    // Commands
    this.addCommand({
      id: 'open',
      name: 'Open',
      callback: () => { void this.openImageViewer(this.settings.defaultFolder); }
    });

    this.addCommand({
      id: 'open-folder',
      name: 'Open folder...',
      callback: () => { void this.showFolderPicker(); }
    });

    this.addCommand({
      id: 'open-current-folder',
      name: 'Browse current folder',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (file && file.parent) {
          if (!checking) {
            void this.openImageViewer(file.parent.path);
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
              .setTitle('Open in image viewer')
              .setIcon('image')
              .onClick(() => { void this.openImageViewer(file.path); });
          });
        } else if (file instanceof TFile && this.isImageFile(file) && file.parent) {
          menu.addItem((item) => {
            item
              .setTitle('Open in image viewer')
              .setIcon('image')
              .onClick(() => { void this.openImageViewer(file.parent!.path, file.path); });
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
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_IMAGE_VIEWER)) {
      if (leaf.view instanceof ImageView) {
        leaf.view.updateSettings(this.settings);
      }
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

    // Create new view
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({
      type: VIEW_TYPE_IMAGE_VIEWER,
      active: true
    });

    // Get view from leaf and load folder
    const view = leaf.view;
    if (view instanceof ImageView) {
      view.loadFolder(folderPath, initialImage);
    }
  }

  showFolderPicker(): void {
    const folders = this.getAllFolders(this.app.vault.getRoot());

    const modal = new FolderSuggestModal(this.app, folders, (folder) => {
      void this.openImageViewer(folder.path);
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
    // Do not detach leaves in onunload
  }
}

class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
  private folders: TFolder[];
  private onChoose: (folder: TFolder) => void;

  constructor(app: App, folders: TFolder[], onChoose: (folder: TFolder) => void) {
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
