import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import type { ControllerInfo, ControllerDevice, FlashProgress } from '@scflash/protocol';
import { useFlashCoordinator } from './hooks/useFlashCoordinator';
import { StepIndicator } from './components/StepIndicator';
import { useTranslation } from 'react-i18next';
import type { FirmwareChoice } from './pages/ChooseFirmwarePage';
import { useHIDEvents } from './hooks/useHIDEvents';
import { Toast } from './components/Toast';
import { logger } from './utils/logger';

// Lazy-loaded pages — reload on stale chunk (deploy changed hashes)
function lazyWithReload(loader: () => Promise<{ default: React.ComponentType }>) {
  return lazy(() =>
    loader().catch(() => {
      window.location.reload();
      return loader();
    }),
  );
}
const ConnectPage = lazyWithReload(() => import('./pages/ConnectPage'));
const HomePage = lazyWithReload(() => import('./pages/HomePage'));
const ChooseFirmwarePage = lazyWithReload(() => import('./pages/ChooseFirmwarePage'));
const PreflightPage = lazyWithReload(() => import('./pages/PreflightPage'));
const FlashingPage = lazyWithReload(() => import('./pages/FlashingPage'));
const CompletePage = lazyWithReload(() => import('./pages/CompletePage'));

type PageName = 'connect' | 'home' | 'choose' | 'preflight' | 'flashing' | 'complete';

const PAGE_HASH: Record<PageName, string> = {
  connect: '#/',
  home: '#/home',
  choose: '#/choose',
  preflight: '#/preflight',
  flashing: '#/flashing',
  complete: '#/complete',
};

const HASH_PAGE = new Map(Object.entries(PAGE_HASH).map(([page, hash]) => [hash, page as PageName]));

export function App() {
  const [page, setPage] = useState<PageName>('connect');
  const [deviceInfo, setDeviceInfo] = useState<ControllerInfo | null>(null);
  const [controller, setController] = useState<ControllerDevice | null>(null);
  const [deviceMode, setDeviceMode] = useState<'normal' | 'bootloader'>('normal');
  const [firmwareChoice, setFirmwareChoice] = useState<FirmwareChoice>('ble');
  const [customFiles, setCustomFiles] = useState<{ lpc: File; softdevice: File; radio: File } | undefined>();
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashProgress, setFlashProgress] = useState<FlashProgress | null>(null);
  const [reconnectPid, setReconnectPid] = useState<number | null>(null);
  const [flashResult, setFlashResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Reconnect promise resolver — must be ref, not state (useState would call the function)
  const reconnectResolverRef = useRef<(() => void) | null>(null);
  const { t } = useTranslation();
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'warn' | 'error' } | null>(null);

  // Refs for popstate handler (avoids stale closures)
  const pageRef = useRef<PageName>(page);
  pageRef.current = page;
  const isFlashingRef = useRef(isFlashing);
  isFlashingRef.current = isFlashing;
  const coordinatorRef = useRef<{ isConnected(): boolean }>({ isConnected: () => false });

  const navigateTo = useCallback((newPage: PageName, replace = false) => {
    setPage(newPage);
    history[replace ? 'replaceState' : 'pushState'](null, '', PAGE_HASH[newPage]);
  }, []);

  // Hash-based routing: sync browser back/forward with page state
  useEffect(() => {
    history.replaceState(null, '', '#/');

    const handlePopState = () => {
      if (isFlashingRef.current) {
        // Block back navigation during flash
        history.pushState(null, '', PAGE_HASH[pageRef.current]);
        return;
      }
      const hash = location.hash || '#/';
      let target = HASH_PAGE.get(hash) ?? 'connect';
      // All pages except connect require a device
      if (target !== 'connect' && !coordinatorRef.current.isConnected()) {
        target = 'connect';
      }
      // Can't navigate back to the transient flashing page
      if (target === 'flashing') {
        target = 'home';
      }
      history.replaceState(null, '', PAGE_HASH[target]);
      setPage(target);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // HID device events — detect plug/unplug
  useHIDEvents({
    onDisconnect: () => {
      if (!isFlashing && (page === 'home' || page === 'choose' || page === 'preflight')) {
        logger.warn('Controller disconnected');
        setToast({ message: t('toast.disconnected'), type: 'warn' });
        coordinator.disconnect();
        setDeviceInfo(null);
        setController(null);
        navigateTo('connect', true);
      }
    },
    onConnect: () => {
      if (page === 'connect') {
        setToast({ message: t('toast.detected'), type: 'info' });
      }
    },
    enabled: !isFlashing,
  });

  const onProgress = useCallback((p: FlashProgress) => setFlashProgress(p), []);

  const isDesktop = !!(window as { desktop?: { isDesktop: boolean } }).desktop?.isDesktop;

  const onReconnectNeeded = useCallback(
    (pid: number): Promise<void> => {
      if (isDesktop) return Promise.resolve();
      return new Promise((resolve) => {
        setReconnectPid(pid);
        reconnectResolverRef.current = resolve;
      });
    },
    [isDesktop],
  );

  const coordinator = useFlashCoordinator(onProgress, onReconnectNeeded);
  coordinatorRef.current = coordinator;

  const handleReadInfo = async (): Promise<ControllerInfo | null> => {
    if (!controller) return null;
    try {
      // Try SWD to wake the radio chip (BLE firmware only)
      await controller.swdStart();
      const info = await coordinator.getInfo();
      await controller.resetSOC();
      if (info) {
        setDeviceInfo(info);
        setController(coordinator.getController());
      }
      return info;
    } catch {
      // SWD failed (production firmware) — just read info directly
      try {
        const info = await coordinator.getInfo();
        if (info) setDeviceInfo(info);
        return info;
      } catch {
        return null;
      }
    }
  };

  const handleConnect = async () => {
    try {
      const mode = await coordinator.connect();
      setDeviceMode(mode);
      if (mode === 'normal') {
        const info = await coordinator.getInfo();
        setDeviceInfo(info);
        setController(coordinator.getController());
      }
      navigateTo('home');
    } catch (e) {
      logger.error(`Connection failed: ${e}`);
      const isLinux = navigator.platform?.startsWith('Linux');
      if (isDesktop && isLinux) {
        setToast({ message: t('connect.udevHint'), type: 'warn' });
      } else {
        setToast({ message: t('connect.failed'), type: 'error' });
      }
    }
  };

  const handleDisconnect = async () => {
    await coordinator.disconnect();
    setDeviceInfo(null);
    setController(null);
    navigateTo('connect', true);
  };

  const handleFlash = () => {
    navigateTo('choose');
  };

  const handleChooseNext = (choice: FirmwareChoice, files?: { lpc: File; softdevice: File; radio: File }) => {
    setFirmwareChoice(choice);
    setCustomFiles(files);
    navigateTo('preflight');
  };

  const handleBeginFlash = async () => {
    setIsFlashing(true);
    setFlashProgress(null);
    setReconnectPid(null);
    setFlashResult(null);
    navigateTo('flashing');

    try {
      await coordinator.flash(firmwareChoice, customFiles);

      // Read final info — radio should be available right after flash
      try {
        const info = await coordinator.getInfo();
        if (info) {
          setDeviceInfo(info);
          setController(coordinator.getController());
        }
      } catch {
        // Info read is best-effort; user can retry via the info modal
      }
      setFlashResult({ success: true });
      navigateTo('complete', true);
    } catch (e) {
      try {
        await coordinator.disconnect();
      } catch {
        // Best-effort cleanup — device may already be disconnected
      }
      setFlashResult({ success: false, error: e instanceof Error ? e.message : String(e) });
      navigateTo('complete', true);
    } finally {
      setIsFlashing(false);
    }
  };

  const handleReconnect = () => {
    setReconnectPid(null);
    reconnectResolverRef.current?.();
    reconnectResolverRef.current = null;
  };

  const handleReturnHome = async () => {
    if (coordinator.isConnected()) {
      setDeviceMode(coordinator.currentMode() as 'normal' | 'bootloader');
      try {
        const info = await coordinator.getInfo();
        setDeviceInfo(info);
        setController(coordinator.getController());
      } catch {
        // Info read failed — home page will show whatever we have
      }
      navigateTo('home', true);
    } else {
      navigateTo('connect', true);
    }
  };

  // Easter egg: play Triumph jingle (index 12) if controller connected
  useEffect(() => {
    const handler = () => {
      if (controller) {
        controller.playJingle(12).catch(() => {});
      }
    };
    window.addEventListener('easter-egg', handler);
    return () => window.removeEventListener('easter-egg', handler);
  }, [controller]);

  // Block navigation and keep screen/tab alive during flash
  useEffect(() => {
    if (!isFlashing) return;
    const handler = () => true;
    window.addEventListener('beforeunload', handler);

    let wakeLock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request('screen')
      .then((wl) => (wakeLock = wl))
      .catch(() => {});

    return () => {
      window.removeEventListener('beforeunload', handler);
      wakeLock?.release().catch(() => {});
    };
  }, [isFlashing]);

  const label = firmwareChoice === 'ble' ? 'BLE' : firmwareChoice === 'production' ? 'Production' : 'Custom';

  // Step indicator mapping
  const stepMap: Record<PageName, number | null> = {
    connect: null,
    home: null,
    choose: 0,
    preflight: 1,
    flashing: 2,
    complete: 3,
  };
  const currentStep = stepMap[page];

  return (
    <>
      {currentStep !== null && (
        <div style={{ maxWidth: 940, margin: '0 auto', padding: '0 20px', width: '100%' }}>
          <StepIndicator
            current={currentStep}
            error={page === 'complete' && flashResult?.success === false}
            complete={page === 'complete' && flashResult?.success === true}
          />
        </div>
      )}
      <Suspense fallback={null}>
        {page === 'connect' && <ConnectPage onConnect={handleConnect} />}
        {page === 'home' && (
          <HomePage
            info={deviceInfo}
            controller={controller}
            mode={deviceMode}
            onReadInfo={handleReadInfo}
            onDisconnect={handleDisconnect}
            onFlash={handleFlash}
          />
        )}
        {page === 'choose' && (
          <ChooseFirmwarePage info={deviceInfo} onBack={() => history.back()} onNext={handleChooseNext} />
        )}
        {page === 'preflight' && (
          <PreflightPage
            choice={firmwareChoice}
            info={deviceInfo}
            isConnected={coordinator.isConnected()}
            onBack={() => history.back()}
            onBegin={handleBeginFlash}
          />
        )}
        {page === 'flashing' && (
          <FlashingPage progress={flashProgress} reconnectPid={reconnectPid} onReconnect={handleReconnect} />
        )}
        {page === 'complete' && flashResult && (
          <CompletePage
            success={flashResult.success}
            error={flashResult.error}
            firmwareType={label}
            info={deviceInfo}
            onReadInfo={handleReadInfo}
            onHome={handleReturnHome}
          />
        )}
      </Suspense>
      <Toast message={toast?.message ?? null} type={toast?.type} onDismiss={() => setToast(null)} />
    </>
  );
}
