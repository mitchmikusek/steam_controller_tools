// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Toast } from '../../src/components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when message is null', () => {
    const { container } = render(
      <Toast message={null} onDismiss={() => {}} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders the message text when message is set', () => {
    render(
      <Toast message="Operation successful" onDismiss={() => {}} />
    );

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('auto-dismisses after the specified duration', () => {
    const onDismiss = vi.fn();
    render(
      <Toast message="Auto dismiss" duration={2000} onDismiss={onDismiss} />
    );

    // Before duration expires, onDismiss should not have been called
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance past the duration timer
    vi.advanceTimersByTime(2000);

    // After duration, there is a 300ms fade-out delay before onDismiss fires
    vi.advanceTimersByTime(300);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after default 3000ms duration', () => {
    const onDismiss = vi.fn();
    render(
      <Toast message="Default timing" onDismiss={onDismiss} />
    );

    vi.advanceTimersByTime(3000);
    vi.advanceTimersByTime(300);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has role="status"', () => {
    render(
      <Toast message="Status message" onDismiss={() => {}} />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(
      <Toast message="Accessible message" onDismiss={() => {}} />
    );

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});
