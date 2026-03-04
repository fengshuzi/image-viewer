import { App, PluginSettingTab, Setting } from 'obsidian';
import type ImageViewerPlugin from '../main';
import { DEFAULT_SETTINGS } from './types';

export class ImageViewerSettingTab extends PluginSettingTab {
  plugin: ImageViewerPlugin;

  constructor(app: App, plugin: ImageViewerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Image Viewer Settings' });

    // Display Settings
    containerEl.createEl('h3', { text: 'Display' });

    new Setting(containerEl)
      .setName('Theme')
      .setDesc('Color theme for the viewer')
      .addDropdown(dropdown => dropdown
        .addOption('dark', 'Dark')
        .addOption('light', 'Light')
        .addOption('system', 'System')
        .setValue(this.plugin.settings.theme)
        .onChange(async (value: 'dark' | 'light' | 'system') => {
          this.plugin.settings.theme = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Background Color')
      .setDesc('Custom background color (hex)')
      .addText(text => text
        .setValue(this.plugin.settings.backgroundColor)
        .onChange(async (value) => {
          this.plugin.settings.backgroundColor = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Show Toolbar')
      .setDesc('Display the toolbar by default')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showToolbar)
        .onChange(async (value) => {
          this.plugin.settings.showToolbar = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Show File Path')
      .setDesc('Display file path in the viewer')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showFilePath)
        .onChange(async (value) => {
          this.plugin.settings.showFilePath = value;
          await this.plugin.saveSettings();
        }));

    // Gallery Settings
    containerEl.createEl('h3', { text: 'Gallery' });

    new Setting(containerEl)
      .setName('Thumbnail Size')
      .setDesc('Size of thumbnails in pixels')
      .addSlider(slider => slider
        .setLimits(60, 200, 10)
        .setValue(this.plugin.settings.thumbnailSize)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.thumbnailSize = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Gallery Columns')
      .setDesc('Number of columns in gallery view')
      .addSlider(slider => slider
        .setLimits(3, 12, 1)
        .setValue(this.plugin.settings.galleryColumns)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.galleryColumns = value;
          await this.plugin.saveSettings();
        }));

    // Navigation Settings
    containerEl.createEl('h3', { text: 'Navigation' });

    new Setting(containerEl)
      .setName('Scroll Behavior')
      .setDesc('Mouse wheel behavior')
      .addDropdown(dropdown => dropdown
        .addOption('navigate', 'Navigate between images')
        .addOption('scroll', 'Scroll zoomed image')
        .setValue(this.plugin.settings.scrollBehavior)
        .onChange(async (value: 'navigate' | 'scroll') => {
          this.plugin.settings.scrollBehavior = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Loop Images')
      .setDesc('Loop back to first image after last')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.loopImages)
        .onChange(async (value) => {
          this.plugin.settings.loopImages = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Sort By')
      .setDesc('Sort images by')
      .addDropdown(dropdown => dropdown
        .addOption('name', 'Name')
        .addOption('date', 'Date')
        .addOption('size', 'Size')
        .addOption('random', 'Random')
        .setValue(this.plugin.settings.sortBy)
        .onChange(async (value: 'name' | 'date' | 'size' | 'random') => {
          this.plugin.settings.sortBy = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Sort Ascending')
      .setDesc('Sort in ascending order')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.sortAscending)
        .onChange(async (value) => {
          this.plugin.settings.sortAscending = value;
          await this.plugin.saveSettings();
        }));

    // Slideshow Settings
    containerEl.createEl('h3', { text: 'Slideshow' });

    new Setting(containerEl)
      .setName('Slideshow Interval')
      .setDesc('Time between slides (seconds)')
      .addSlider(slider => slider
        .setLimits(1, 30, 1)
        .setValue(this.plugin.settings.slideshowInterval)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.slideshowInterval = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Loop Slideshow')
      .setDesc('Loop slideshow playback')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.slideshowLoop)
        .onChange(async (value) => {
          this.plugin.settings.slideshowLoop = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Random Order')
      .setDesc('Play slideshow in random order')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.slideshowRandom)
        .onChange(async (value) => {
          this.plugin.settings.slideshowRandom = value;
          await this.plugin.saveSettings();
        }));

    // Zoom Settings
    containerEl.createEl('h3', { text: 'Zoom' });

    new Setting(containerEl)
      .setName('Zoom Step')
      .setDesc('Zoom increment step')
      .addSlider(slider => slider
        .setLimits(0.1, 0.5, 0.05)
        .setValue(this.plugin.settings.zoomStep)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.zoomStep = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Default Zoom Mode')
      .setDesc('How images fit initially')
      .addDropdown(dropdown => dropdown
        .addOption('fit', 'Fit to window')
        .addOption('fill', 'Fill window')
        .addOption('actual', 'Actual size')
        .setValue(this.plugin.settings.defaultZoomMode)
        .onChange(async (value: 'fit' | 'fill' | 'actual') => {
          this.plugin.settings.defaultZoomMode = value;
          await this.plugin.saveSettings();
        }));

    // Folder Settings
    containerEl.createEl('h3', { text: 'Folders' });

    new Setting(containerEl)
      .setName('Default Folder')
      .setDesc('Default folder to open')
      .addText(text => text
        .setPlaceholder('assets')
        .setValue(this.plugin.settings.defaultFolder)
        .onChange(async (value) => {
          this.plugin.settings.defaultFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Scan Subfolders')
      .setDesc('Include images from subfolders')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.scanSubfolders)
        .onChange(async (value) => {
          this.plugin.settings.scanSubfolders = value;
          await this.plugin.saveSettings();
        }));

    // Reset button
    new Setting(containerEl)
      .setName('Reset to Defaults')
      .setDesc('Reset all settings to default values')
      .addButton(button => button
        .setButtonText('Reset')
        .setWarning()
        .onClick(async () => {
          this.plugin.settings = { ...DEFAULT_SETTINGS };
          await this.plugin.saveSettings();
          this.display();
        }));
  }
}
