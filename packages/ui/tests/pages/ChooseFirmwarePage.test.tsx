// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ChooseFirmwarePage } from '../../src/pages/ChooseFirmwarePage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('ChooseFirmwarePage', () => {
  afterEach(cleanup);

  it('offers the BLE gamepad option', () => {
    render(<ChooseFirmwarePage info={null} onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText('choose.gamepadTitle')).toBeInTheDocument();
  });

  it('explains what the gamepad option does once selected', () => {
    render(<ChooseFirmwarePage info={null} onBack={() => {}} onNext={() => {}} />);

    // The note carries the warnings that matter: radio only, buttons need the
    // LPC firmware too, and how to get back.
    expect(screen.queryByText('choose.gamepadNote')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('choose.gamepadTitle'));
    expect(screen.getByText('choose.gamepadNote')).toBeInTheDocument();
  });

  it('needs no uploaded files for the gamepad option', () => {
    const onNext = vi.fn();
    render(<ChooseFirmwarePage info={null} onBack={() => {}} onNext={onNext} />);

    fireEvent.click(screen.getByText('choose.gamepadTitle'));
    const next = screen.getByRole('button', { name: 'choose.next' });
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(onNext).toHaveBeenCalledWith('gamepad');
  });

  it('still requires all three files for the custom option', () => {
    render(<ChooseFirmwarePage info={null} onBack={() => {}} onNext={() => {}} />);

    fireEvent.click(screen.getByText('choose.customTitle'));
    expect(screen.getByRole('button', { name: 'choose.next' })).toBeDisabled();
  });

  it('does not mark the gamepad option as installed, which cannot be detected', () => {
    // detectFirmwareType only distinguishes Valve's BLE and production LPC
    // firmware; the gamepad option keeps Valve's BLE LPC, so "installed" would
    // be misleading either way.
    const info = { usbPid: 0x1102, bootloaderRev: 1, firmwareRev: 0x5b0f21bd, radioRev: 1 };
    render(<ChooseFirmwarePage info={info} onBack={() => {}} onNext={() => {}} />);

    // SelectCard renders a hardcoded 'INSTALLED' badge, not a translation key.
    expect(screen.getAllByText('INSTALLED')).toHaveLength(1);
  });
});
