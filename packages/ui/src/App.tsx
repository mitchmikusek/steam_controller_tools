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
function lazyWithReload(loader: () => Promise<any>) {
  return lazy(() => loader().catch(() => { window.location.reload(); return loader(); }));
}
const ConnectPage = lazyWithReload(() => import('./pages/ConnectPage'));
const HomePage = lazyWithReload(() => import('./pages/HomePage'));
const ChooseFirmwarePage = lazyWithReload(() => import('./pages/ChooseFirmwarePage'));
const PreflightPage = lazyWithReload(() => import('./pages/PreflightPage'));
const FlashingPage = lazyWithReload(() => import('./pages/FlashingPage'));
const CompletePage = lazyWithReload(() => import('./pages/CompletePage'));

type PageName = 'connect' | 'home' | 'choose' | 'preflight' | 'flashing' | 'complete';

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

  // HID device events — detect plug/unplug
  useHIDEvents({
    onDisconnect: () => {
      if (!isFlashing && (page === 'home' || page === 'choose')) {
        logger.warn('Controller disconnected');
        setToast({ message: t('toast.disconnected'), type: 'warn' });
        coordinator.disconnect();
        setDeviceInfo(null);
        setController(null);
        setPage('connect');
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

  const onReconnectNeeded = useCallback((pid: number): Promise<void> => {
    return new Promise((resolve) => {
      setReconnectPid(pid);
      reconnectResolverRef.current = resolve;
    });
  }, []);

  const coordinator = useFlashCoordinator(onProgress, onReconnectNeeded);

  const handleConnect = async () => {
    try {
      const mode = await coordinator.connect();
      setDeviceMode(mode);
      if (mode === 'normal') {
        const info = await coordinator.getInfo();
        setDeviceInfo(info);
        setController(coordinator.getController());
      }
      setPage('home');
    } catch (e) {
      logger.error(`Connection failed: ${e}`);
    }
  };

  const handleDisconnect = async () => {
    await coordinator.disconnect();
    setDeviceInfo(null);
    setController(null);
    setPage('connect');
  };

  const handleFlash = () => {
    setPage('choose');
  };

  const handleChooseNext = (choice: FirmwareChoice, files?: { lpc: File; softdevice: File; radio: File }) => {
    setFirmwareChoice(choice);
    setCustomFiles(files);
    setPage('preflight');
  };

  const handleBeginFlash = async () => {
    setIsFlashing(true);
    setFlashProgress(null);
    setReconnectPid(null);
    setFlashResult(null);
    setPage('flashing');

    try {
      await coordinator.flash(firmwareChoice, customFiles);

      // Retry getInfo until radio is populated
      let info: ControllerInfo | null = null;
      for (let i = 0; i < 8; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          info = await coordinator.getInfo();
          if (info && info.radioRev !== 0) break;
        } catch { /* ok */ }
      }
      setDeviceInfo(info);
      setController(coordinator.getController());

      setFlashResult({ success: true });
      setPage('complete');
    } catch (e) {
      try { await coordinator.disconnect(); } catch { /* ok */ }
      setFlashResult({ success: false, error: e instanceof Error ? e.message : String(e) });
      setPage('complete');
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
      } catch { /* ok */ }
      setPage('home');
    } else {
      setPage('connect');
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

  // Block navigation during flash
  if (typeof window !== 'undefined') {
    window.onbeforeunload = isFlashing ? () => true : null;
  }

  const label = firmwareChoice === 'ble' ? 'BLE' : firmwareChoice === 'production' ? 'Production' : 'Custom';

  // Step indicator mapping
  const stepMap: Record<PageName, number | null> = {
    connect: null, home: null,
    choose: 0, preflight: 1, flashing: 2, complete: 3,
  };
  const currentStep = stepMap[page];

  return (
    <>
      {currentStep !== null && (
        <div style={{ maxWidth: 940, margin: '0 auto', padding: '0 20px', width: '100%' }}>
          <StepIndicator current={currentStep} error={page === 'complete' && flashResult?.success === false} />
        </div>
      )}
      <Suspense fallback={null}>
      {page === 'connect' && <ConnectPage onConnect={handleConnect} />}
      {page === 'home' && (
        <HomePage
          info={deviceInfo}
          controller={controller}
          mode={deviceMode}
          onDisconnect={handleDisconnect}
          onFlash={handleFlash}
        />
      )}
      {page === 'choose' && (
        <ChooseFirmwarePage
          info={deviceInfo}
          onBack={handleReturnHome}
          onNext={handleChooseNext}
        />
      )}
      {page === 'preflight' && (
        <PreflightPage
          choice={firmwareChoice}
          info={deviceInfo}
          isConnected={coordinator.isConnected()}
          onBack={() => setPage('choose')}
          onBegin={handleBeginFlash}
        />
      )}
      {page === 'flashing' && (
        <FlashingPage
          progress={flashProgress}
          reconnectPid={reconnectPid}
          onReconnect={handleReconnect}
        />
      )}
      {page === 'complete' && flashResult && (
        <CompletePage
          success={flashResult.success}
          error={flashResult.error}
          firmwareType={label}
          info={deviceInfo}
          onHome={handleReturnHome}
        />
      )}
      </Suspense>
      <Toast
        message={toast?.message ?? null}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />
    </>
  );
}
