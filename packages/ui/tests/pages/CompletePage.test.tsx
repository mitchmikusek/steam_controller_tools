// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { CompletePage } from '../../src/pages/CompletePage';
import type { FirmwareChoice } from '../../src/pages/ChooseFirmwarePage';
import { GAMEPAD_TEST_GUIDE_URL } from '../../src/utils/firmware-sources';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderComplete(choice: FirmwareChoice, success = true) {
  return render(
    <CompletePage success={success} choice={choice} firmwareType="whatever" info={null} onHome={() => {}} />,
  );
}

describe('CompletePage', () => {
  it('opens the test guide in a new tab after a gamepad flash', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderComplete('gamepad');
    fireEvent.click(screen.getByRole('button', { name: 'complete.openTestGuide' }));
    expect(open).toHaveBeenCalledWith(GAMEPAD_TEST_GUIDE_URL, '_blank', 'noopener');
  });

  it('does not offer the test guide for other firmware', () => {
    renderComplete('ble');
    expect(screen.queryByText('complete.openTestGuide')).not.toBeInTheDocument();
  });

  it('does not offer the test guide when the flash failed', () => {
    renderComplete('gamepad', false);
    expect(screen.queryByText('complete.openTestGuide')).not.toBeInTheDocument();
  });

  it('keys the BLE modes help on the choice, not the display label', () => {
    renderComplete('ble');
    expect(screen.getByText('complete.viewBleModes')).toBeInTheDocument();
  });
});
