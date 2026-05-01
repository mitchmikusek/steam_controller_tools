import {
  FlashCoordinator,
  createBLEFirmwareSet,
  createProductionFirmwareSet,
  loadFirmwareFromUrl,
  loadFirmwareFromFile,
  type ControllerInfo,
} from '@scflash/protocol';
import { logger } from './logger';
import { ConnectPage } from './pages/connect';
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

type PageName = 'connect' | 'home' | 'choose' | 'preflight' | 'flashing' | 'complete';

export class App {
  private root: HTMLElement;
  private pageContainer: HTMLElement;
  private coordinator: FlashCoordinator;
  private deviceInfo: ControllerInfo | null = null;

  // Pages
  private connectPage: ConnectPage;
  private homePage: HomePage;
  private choosePage: ChooseFirmwarePage;
  private preflightPage: PreflightPage;
  private flashingPage: FlashingPage;
  private completePage: CompletePage;

  // State
  private firmwareChoice: FirmwareChoice = 'ble';
  private isFlashing = false;
  private isTransitioning = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.coordinator = new FlashCoordinator();

    // Page container
    this.pageContainer = document.createElement('div');
    this.pageContainer.style.cssText = 'flex:1;display:flex;flex-direction:column';
    root.appendChild(this.pageContainer);

    // Create pages
    this.connectPage = new ConnectPage();
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

    // Wire connect page
    this.connectPage.onConnect = () => this.handleConnect();

    // Wire home page
    this.homePage.onDisconnect = () => this.handleDisconnect();
    this.homePage.onFlash = () => {
      this.choosePage.setDeviceInfo(this.deviceInfo);
      this.showPage('choose');
    };

    // Wire choose page
    this.choosePage.onBack = () => this.returnHome();
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
        history.pushState({ page: 'flashing' }, '', '#flashing');
        return;
      }
      const page = (e.state?.page ?? 'connect') as PageName;
      if (page === 'home') {
        if (this.coordinator.isConnected) {
          this.homePage.setMode(this.coordinator.currentMode as 'normal' | 'bootloader');
          this.showPage('home', false);
        } else {
          this.showPage('connect', false);
        }
      } else {
        this.showPage(page, false);
      }
    });

    // Warn before closing tab/window during flash
    window.addEventListener('beforeunload', (e) => {
      if (this.isFlashing) {
        e.preventDefault();
      }
    });

    // Start on connect page
    this.showPage('connect');
    logger.info('Steam Controller Flash Tool ready');
  }

  private showPage(page: PageName, pushHistory = true): void {
    if (this.isTransitioning) return;

    const current = this.pageContainer.firstElementChild as HTMLElement | null;
    const doSwap = () => {
      this.isTransitioning = false;
      this.pageContainer.textContent = '';
      if (pushHistory) {
        history.pushState({ page }, '', `#${page}`);
      }
      const pages: Record<PageName, { el: HTMLElement }> = {
        connect: this.connectPage,
        home: this.homePage,
        choose: this.choosePage,
        preflight: this.preflightPage,
        flashing: this.flashingPage,
        complete: this.completePage,
      };
      const el = pages[page].el;
      el.classList.remove('fade-out');
      // Re-trigger the pageIn animation
      el.style.animation = 'none';
      el.offsetHeight; // force reflow
      el.style.animation = '';
      this.pageContainer.appendChild(el);
    };

    if (current) {
      this.isTransitioning = true;
      current.classList.add('fade-out');
      setTimeout(doSwap, 350);
    } else {
      doSwap();
    }
  }

  private async handleConnect(): Promise<void> {
    try {
      const mode = await this.coordinator.connect();
      this.homePage.setMode(mode);
      if (mode === 'normal') {
        this.deviceInfo = await this.coordinator.getInfo();
        this.homePage.setDeviceInfo(this.deviceInfo);
        this.homePage.setController(this.coordinator.getController());
      }
      this.showPage('home');
    } catch (e) {
      logger.error(`Connection failed: ${e}`);
    }
  }

  private async handleDisconnect(): Promise<void> {
    await this.coordinator.disconnect();
    this.deviceInfo = null;
    this.showPage('connect');
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

      // Read info — retry until radio is populated (device needs time after reboot)
      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          this.deviceInfo = await this.coordinator.getInfo();
          if (this.deviceInfo && this.deviceInfo.radioRev !== 0) break;
        } catch { /* may fail */ }
        await new Promise(r => setTimeout(r, 2000));
      }

      const label = this.firmwareChoice === 'ble' ? 'BLE' :
                    this.firmwareChoice === 'production' ? 'Production' : 'Custom';
      this.isFlashing = false;
      this.completePage.showSuccess(label, this.deviceInfo);
      this.showPage('complete');
    } catch (e) {
      this.isFlashing = false;
      // Clean up connection state on error
      try { await this.coordinator.disconnect(); } catch { /* ok */ }
      const errMsg = e instanceof Error ? e.message : String(e);
      this.completePage.showError(errMsg);
      this.showPage('complete');
    }
  }

  private async returnHome(): Promise<void> {
    if (this.coordinator.isConnected) {
      this.homePage.setMode(this.coordinator.currentMode as 'normal' | 'bootloader');
      try {
        this.deviceInfo = await this.coordinator.getInfo();
        this.homePage.setDeviceInfo(this.deviceInfo);
        this.homePage.setController(this.coordinator.getController());
      } catch { /* ok */ }
      this.showPage('home');
    } else {
      this.showPage('connect');
    }
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
