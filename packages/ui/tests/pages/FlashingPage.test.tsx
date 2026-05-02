// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlashingPage } from '../../src/pages/FlashingPage';
import type { FlashProgress } from '@scflash/protocol';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.percent ? `${opts.percent}% complete` : key,
    i18n: { language: 'en' },
  }),
}));

describe('FlashingPage', () => {
  it('shows initializing text when progress is null', () => {
    render(
      <FlashingPage progress={null} reconnectPid={null} onReconnect={() => {}} />
    );

    expect(screen.getByText('flashing.initializing')).toBeInTheDocument();
  });

  it('shows phase name with "..." when progress has a phase', () => {
    const progress: FlashProgress = { phase: 'Erasing', percent: 30 };
    render(
      <FlashingPage progress={progress} reconnectPid={null} onReconnect={() => {}} />
    );

    expect(screen.getByText('Erasing...')).toBeInTheDocument();
  });

  it('shows reconnect button when reconnectPid is set', () => {
    const progress: FlashProgress = { phase: 'Writing', percent: 50 };
    render(
      <FlashingPage progress={progress} reconnectPid={0x1002} onReconnect={() => {}} />
    );

    expect(screen.getByText('flashing.reconnect')).toBeInTheDocument();
  });

  it('shows "Flash Complete" text when progress phase is Complete', () => {
    const progress: FlashProgress = { phase: 'Complete', percent: 100 };
    render(
      <FlashingPage progress={progress} reconnectPid={null} onReconnect={() => {}} />
    );

    expect(screen.getByText('flashing.flashComplete')).toBeInTheDocument();
  });

  it('shows percent complete text from translation', () => {
    const progress: FlashProgress = { phase: 'Writing', percent: 42 };
    render(
      <FlashingPage progress={progress} reconnectPid={null} onReconnect={() => {}} />
    );

    expect(screen.getByText('42% complete')).toBeInTheDocument();
  });

  it('shows reconnection required text when reconnectPid is set', () => {
    const progress: FlashProgress = { phase: 'Writing', percent: 80 };
    render(
      <FlashingPage progress={progress} reconnectPid={0x1002} onReconnect={() => {}} />
    );

    expect(screen.getAllByText('flashing.reconnectionRequired').length).toBeGreaterThan(0);
  });
});
