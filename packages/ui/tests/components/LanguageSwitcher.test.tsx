// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
import { AppHeader } from '../../src/components/AppHeader';

describe('LanguageSwitcher', () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('en');
  });

  it('renders all language options', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>,
    );
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '中文' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Français' })).toBeInTheDocument();
  });

  it('defaults to English', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>,
    );
    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toHaveValue('en');
  });

  it('switches language when selecting a new option', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>,
    );
    const select = screen.getByRole('combobox', { name: 'Language' });
    fireEvent.change(select, { target: { value: 'es' } });
    expect(i18n.language).toBe('es');
  });
});

describe('AppHeader responds to language changes', () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('en');
  });

  it('renders title and subtitle in English by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AppHeader />
      </I18nextProvider>,
    );
    expect(screen.getByText('Steam Controller (2015)')).toBeInTheDocument();
    expect(screen.getByText('Firmware Flash Tool')).toBeInTheDocument();
  });

  it('updates title and subtitle when language changes to Spanish', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AppHeader />
      </I18nextProvider>,
    );

    await act(() => i18n.changeLanguage('es'));

    await waitFor(() => {
      expect(screen.getByText('Herramienta de Flash de Firmware')).toBeInTheDocument();
    });
    expect(screen.getByText('Steam Controller (2015)')).toBeInTheDocument();
  });

  it('updates title and subtitle when language changes to Chinese', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AppHeader />
      </I18nextProvider>,
    );

    await act(() => i18n.changeLanguage('zh'));

    await waitFor(() => {
      expect(screen.getByText('固件刷写工具')).toBeInTheDocument();
    });
    expect(screen.getByText('Steam Controller (2015)')).toBeInTheDocument();
  });

  it('updates title and subtitle when language changes to French', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AppHeader />
      </I18nextProvider>,
    );

    await act(() => i18n.changeLanguage('fr'));

    await waitFor(() => {
      expect(screen.getByText('Outil de Flash du Firmware')).toBeInTheDocument();
    });
    expect(screen.getByText('Steam Controller (2015)')).toBeInTheDocument();
  });
});
