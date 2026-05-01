import {
  FlashCoordinator,
  createBLEFirmwareSet,
  createProductionFirmwareSet,
  loadFirmwareFromUrl,
  loadFirmwareFromFile,
  type ControllerInfo,
} from '@scflash/protocol';
import { logger } from './logger';
import { HomePage } from './pages/home';
import { ChooseFirmwarePage, type FirmwareChoice } from './pages/choose-firmware';
import { PreflightPage } from './pages/preflight';
import { FlashingPage } from './pages/flashing';
import { CompletePage } from './pages/complete';

const BLE_FW = {
  lpc: 'fw_images/ble/vcf_wired_controller_d0g_5b0f21bd.bin',
  softdevice: 'fw_images/ble/s110_nrf51_8.0.0_softdevice.bin',
  radio: 'fw_images/ble/vcf_wired_controller_d0g_5a0e3f348_radio.bin',
};

const PROD_FW = {
  lpc: 'fw_images/production/vcf_wired_controller_d0g.bin',
  bootloader: 'fw_images/production/d0g_bootloader.bin',
  radio: 'fw_images/production/d0g_module.bin',
};

export class App {
  private root: HTMLElement;
  private pageContainer: HTMLElement;
  private coordinator: FlashCoordinator;
  private deviceInfo: ControllerInfo | null = null;

  // Pages
  private homePage: HomePage;
  private choosePage: ChooseFirmwarePage;
  private preflightPage: PreflightPage;
  private flashingPage: FlashingPage;
  private completePage: CompletePage;

  // State
  private firmwareChoice: FirmwareChoice = 'ble';
  private isFlashing = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.coordinator = new FlashCoordinator();

    // Page container
    this.pageContainer = document.createElement('div');
    root.appendChild(this.pageContainer);

    // Create pages
    this.homePage = new HomePage();
    this.choosePage = new ChooseFirmwarePage();
    this.preflightPage = new PreflightPage();
    this.flashingPage = new FlashingPage();
    this.completePage = new CompletePage();

    // Wire coordinator
    this.coordinator.onProgress = (p) => this.flashingPage.updateProgress(p);
    this.coordinator.onLog = (level, msg) => logger.log(level, msg);
    this.coordinator.onReconnectNeeded = (pid) => this.flashingPage.showReconnectPrompt(pid);

    // Wire logger to flashing page log
    logger.addListener((level, ts, msg) => this.flashingPage.appendLog(level, ts, msg));

    // Wire home page
    this.homePage.onConnect = () => this.handleConnect();
    this.homePage.onDisconnect = () => this.handleDisconnect();
    this.homePage.onFlash = () => {
      this.choosePage.setDeviceInfo(this.deviceInfo);
      this.showPage('choose');
    };

    // Wire choose page
    this.choosePage.onBack = () => this.showPage('home');
    this.choosePage.onNext = (choice) => {
      this.firmwareChoice = choice;
      this.preflightPage.configure(choice, this.deviceInfo, this.coordinator.isConnected);
      this.showPage('preflight');
    };

    // Wire preflight page
    this.preflightPage.onBack = () => this.showPage('choose');
    this.preflightPage.onBegin = () => this.startFlash();

    // Wire complete page
    this.completePage.onHome = () => this.returnHome();

    // Browser back button support
    window.addEventListener('popstate', (e) => {
      if (this.isFlashing) {
        // Block navigation during flash — push state back
        history.pushState({ page: 'flashing' }, '', '#flashing');
        return;
      }
      const page = e.state?.page ?? 'home';
      this.showPage(page, false);
    });

    // Warn before closing tab/window during flash
    window.addEventListener('beforeunload', (e) => {
      if (this.isFlashing) {
        e.preventDefault();
      }
    });

    // Start on home
    this.showPage('home');
    logger.info('Steam Controller Flash Tool ready');
  }

  private showPage(page: 'home' | 'choose' | 'preflight' | 'flashing' | 'complete', pushHistory = true): void {
    this.pageContainer.textContent = '';
    if (pushHistory) {
      history.pushState({ page }, '', `#${page}`);
    }
    const pages = {
      home: this.homePage,
      choose: this.choosePage,
      preflight: this.preflightPage,
      flashing: this.flashingPage,
      complete: this.completePage,
    };
    this.pageContainer.appendChild(pages[page].el);
  }

  private async handleConnect(): Promise<void> {
    try {
      const mode = await this.coordinator.connect();
      this.homePage.setConnected(mode);
      if (mode === 'normal') {
        this.deviceInfo = await this.coordinator.getInfo();
        this.homePage.setDeviceInfo(this.deviceInfo);
        this.homePage.setController(this.coordinator.getController());
      }
    } catch (e) {
      logger.error(`Connection failed: ${e}`);
      this.homePage.setConnected('disconnected');
    }
  }

  private async handleDisconnect(): Promise<void> {
    await this.coordinator.disconnect();
    this.deviceInfo = null;
    this.homePage.setDeviceInfo(null);
    this.homePage.setController(null);
  }

  private async startFlash(): Promise<void> {
    this.isFlashing = true;
    this.flashingPage.reset();
    this.showPage('flashing');

    try {
      const fw = this.firmwareChoice === 'custom'
        ? await this.loadCustomFirmware()
        : this.firmwareChoice === 'ble'
          ? await this.loadBundledBLEFirmware()
          : await this.loadBundledProductionFirmware();

      if (this.firmwareChoice === 'ble' || this.firmwareChoice === 'custom') {
        await this.coordinator.flashBLE(fw);
      } else {
        await this.coordinator.flashProduction(fw);
      }

      // Get updated info
      try {
        this.deviceInfo = await this.coordinator.getInfo();
      } catch { /* may fail if not in normal mode */ }

      const label = this.firmwareChoice === 'ble' ? 'BLE' :
                    this.firmwareChoice === 'production' ? 'Production' : 'Custom';
      this.isFlashing = false;
      this.completePage.showSuccess(label, this.deviceInfo);
      this.showPage('complete');
    } catch (e) {
      this.isFlashing = false;
      const errMsg = e instanceof Error ? e.message : String(e);
      this.completePage.showError(errMsg);
      this.showPage('complete');
    }
  }

  private async returnHome(): Promise<void> {
    // Refresh device state
    if (this.coordinator.isConnected) {
      this.homePage.setConnected(this.coordinator.currentMode);
      try {
        this.deviceInfo = await this.coordinator.getInfo();
        this.homePage.setDeviceInfo(this.deviceInfo);
        this.homePage.setController(this.coordinator.getController());
      } catch { /* ok */ }
    } else {
      this.homePage.setConnected('disconnected');
      this.homePage.setDeviceInfo(null);
      this.homePage.setController(null);
    }
    this.showPage('home');
  }

  private async loadBundledBLEFirmware() {
    logger.info('Loading bundled BLE firmware...');
    const [lpc, softdevice, radio] = await Promise.all([
      loadFirmwareFromUrl(BLE_FW.lpc),
      loadFirmwareFromUrl(BLE_FW.softdevice),
      loadFirmwareFromUrl(BLE_FW.radio),
    ]);
    return createBLEFirmwareSet(lpc, softdevice, radio);
  }

  private async loadBundledProductionFirmware() {
    logger.info('Loading bundled production firmware...');
    const [lpc, bootloader, radio] = await Promise.all([
      loadFirmwareFromUrl(PROD_FW.lpc),
      loadFirmwareFromUrl(PROD_FW.bootloader),
      loadFirmwareFromUrl(PROD_FW.radio),
    ]);
    return createProductionFirmwareSet(lpc, bootloader, radio);
  }

  private async loadCustomFirmware() {
    logger.info('Loading custom firmware files...');
    const [lpc, softdevice, radio] = await Promise.all([
      loadFirmwareFromFile(this.choosePage.lpcFile!),
      loadFirmwareFromFile(this.choosePage.softdeviceFile!),
      loadFirmwareFromFile(this.choosePage.radioFile!),
    ]);
    return createBLEFirmwareSet(lpc, softdevice, radio);
  }
}
