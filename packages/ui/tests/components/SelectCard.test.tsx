// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SelectCard } from '../../src/components/SelectCard';

describe('SelectCard', () => {
  afterEach(cleanup);

  it('renders title and description', () => {
    render(
      <SelectCard title="BLE Firmware" desc="Bluetooth Low Energy" selected={false} onClick={() => {}} />
    );
    expect(screen.getByText('BLE Firmware')).toBeInTheDocument();
    expect(screen.getByText('Bluetooth Low Energy')).toBeInTheDocument();
  });

  it('has "selected" class when selected=true', () => {
    const { container } = render(
      <SelectCard title="Test" desc="Desc" selected={true} onClick={() => {}} />
    );
    expect(container.querySelector('.select-card')).toHaveClass('selected');
  });

  it('does not have "selected" class when selected=false', () => {
    const { container } = render(
      <SelectCard title="Test" desc="Desc" selected={false} onClick={() => {}} />
    );
    expect(container.querySelector('.select-card')).not.toHaveClass('selected');
  });

  it('shows INSTALLED badge when installed=true', () => {
    render(
      <SelectCard title="Test" desc="Desc" selected={false} installed={true} onClick={() => {}} />
    );
    expect(screen.getByText('INSTALLED')).toBeInTheDocument();
  });

  it('does not show INSTALLED badge when installed is not set', () => {
    render(
      <SelectCard title="Test" desc="Desc" selected={false} onClick={() => {}} />
    );
    expect(screen.queryByText('INSTALLED')).not.toBeInTheDocument();
  });

  it('fires onClick when clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <SelectCard title="Test" desc="Desc" selected={false} onClick={handleClick} />
    );
    fireEvent.click(container.querySelector('.select-card')!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has aria-pressed reflecting selected state', () => {
    const { container, rerender } = render(
      <SelectCard title="Test" desc="Desc" selected={true} onClick={() => {}} />
    );
    expect(container.querySelector('.select-card')).toHaveAttribute('aria-pressed', 'true');

    rerender(<SelectCard title="Test" desc="Desc" selected={false} onClick={() => {}} />);
    expect(container.querySelector('.select-card')).toHaveAttribute('aria-pressed', 'false');
  });
});
