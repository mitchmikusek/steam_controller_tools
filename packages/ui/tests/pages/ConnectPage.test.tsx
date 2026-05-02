// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ConnectPage } from '../../src/pages/ConnectPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('ConnectPage', () => {
  afterEach(cleanup);

  it('renders controller image', () => {
    render(<ConnectPage onConnect={async () => {}} />);
    expect(screen.getByAltText('Steam Controller')).toBeInTheDocument();
  });

  it('renders connect hint text', () => {
    render(<ConnectPage onConnect={async () => {}} />);
    expect(screen.getByText('connect.hint')).toBeInTheDocument();
  });

  it('renders connect button', () => {
    render(<ConnectPage onConnect={async () => {}} />);
    expect(screen.getByRole('button', { name: 'connect.button' })).toBeInTheDocument();
  });

  it('calls onConnect when button is clicked', async () => {
    const onConnect = vi.fn().mockResolvedValue(undefined);
    render(<ConnectPage onConnect={onConnect} />);

    fireEvent.click(screen.getByRole('button', { name: 'connect.button' }));
    await waitFor(() => expect(onConnect).toHaveBeenCalledTimes(1));
  });

  it('shows connecting text and disables button while connecting', async () => {
    let resolveConnect: () => void;
    const onConnect = vi.fn(() => new Promise<void>(r => { resolveConnect = r; }));
    render(<ConnectPage onConnect={onConnect} />);

    fireEvent.click(screen.getByRole('button', { name: 'connect.button' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'connect.connecting' })).toBeDisabled();
    });

    resolveConnect!();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'connect.button' })).not.toBeDisabled();
    });
  });
});
