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

    // Display Settings
    new Setting(containerEl)
      .setName('Display')
      .setHeading();

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
      .setName('Background color')
      .setDesc('Custom background color (hex)')
      .addText(text => text
        .setValue(this.plugin.settings.backgroundColor)
        .onChange(async (value) => {
          this.plugin.settings.backgroundColor = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Show toolbar')
      .setDesc('Display the toolbar by default')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showToolbar)
        .onChange(async (value) => {
          this.plugin.settings.showToolbar = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Show file path')
      .setDesc('Display file path in the viewer')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showFilePath)
        .onChange(async (value) => {
          this.plugin.settings.showFilePath = value;
          await this.plugin.saveSettings();
        }));

    // Gallery Settings
    new Setting(containerEl)
      .setName('Gallery')
      .setHeading();

    new Setting(containerEl)
      .setName('Thumbnail size')
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
      .setName('Gallery columns')
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
    new Setting(containerEl)
      .setName('Navigation')
      .setHeading();

    new Setting(containerEl)
      .setName('Scroll behavior')
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
      .setName('Loop images')
      .setDesc('Loop back to first image after last')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.loopImages)
        .onChange(async (value) => {
          this.plugin.settings.loopImages = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Sort by')
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
      .setName('Sort ascending')
      .setDesc('Sort in ascending order')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.sortAscending)
        .onChange(async (value) => {
          this.plugin.settings.sortAscending = value;
          await this.plugin.saveSettings();
        }));

    // Slideshow Settings
    new Setting(containerEl)
      .setName('Slideshow')
      .setHeading();

    new Setting(containerEl)
      .setName('Slideshow interval')
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
      .setName('Loop slideshow')
      .setDesc('Loop slideshow playback')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.slideshowLoop)
        .onChange(async (value) => {
          this.plugin.settings.slideshowLoop = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Random order')
      .setDesc('Play slideshow in random order')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.slideshowRandom)
        .onChange(async (value) => {
          this.plugin.settings.slideshowRandom = value;
          await this.plugin.saveSettings();
        }));

    // Zoom Settings
    new Setting(containerEl)
      .setName('Zoom')
      .setHeading();

    new Setting(containerEl)
      .setName('Zoom step')
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
      .setName('Default zoom mode')
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
    new Setting(containerEl)
      .setName('Folders')
      .setHeading();

    new Setting(containerEl)
      .setName('Default folder')
      .setDesc('Default folder to open')
      .addText(text => text
        .setPlaceholder('assets')
        .setValue(this.plugin.settings.defaultFolder)
        .onChange(async (value) => {
          this.plugin.settings.defaultFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Scan subfolders')
      .setDesc('Include images from subfolders')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.scanSubfolders)
        .onChange(async (value) => {
          this.plugin.settings.scanSubfolders = value;
          await this.plugin.saveSettings();
        }));

    // Reset button
    new Setting(containerEl)
      .setName('Reset to defaults')
      .setDesc('Reset all settings to default values')
      .addButton(button => button
        .setButtonText('Reset')
        .setWarning()
        .onClick(async () => {
          this.plugin.settings = { ...DEFAULT_SETTINGS };
          await this.plugin.saveSettings();
          this.display();
        }));

    const donateSection = containerEl.createDiv({ cls: 'plugin-donate-section' });
    new Setting(donateSection)
      .setName('Support the developer')
      .setHeading();
    donateSection.createEl('p', { text: '如果这个插件帮助了你，欢迎请作者喝杯咖啡', cls: 'plugin-donate-desc' });
    const imgWrap = donateSection.createDiv({ cls: 'plugin-donate-qr' });
    imgWrap.createEl('img', { attr: { src: this.plugin.app.vault.adapter.getResourcePath(`${this.plugin.manifest.dir}/assets/wechat-donate.jpg`), alt: '微信打赏', width: '160' } });
    imgWrap.createEl('p', { text: '微信扫码', cls: 'plugin-donate-label' });
  }
}
