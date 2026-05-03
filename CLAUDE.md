# CLAUDE.md

## What This Is

A browser-based tool that flashes BLE (Bluetooth) firmware onto the original Steam Controller (2015) using the WebHID API. Monorepo with two packages: a framework-agnostic protocol library and a React UI.

Live at [steamcontroller.tools](https://steamcontroller.tools). Deployed via Cloudflare Pages.

## Monorepo Structure

```
packages/
├── protocol/   # @scflash/protocol — HID protocol library (TypeScript, zero UI deps)
│   ├── src/    # Device communication, flash orchestration, checksum verification
│   └── tests/  # Unit tests (MockHIDTransport, no hardware needed)
└── ui/         # @scflash/ui — React 19 web app (Vite)
    ├── src/    # Pages, components, hooks, i18n, CSS
    └── tests/  # Component + page tests (jsdom, React Testing Library)
```

## Commands

```bash
pnpm install          # Install all dependencies
pnpm run dev          # Dev server (UI only, opens https://localhost:5173)
pnpm run build        # Full build (protocol first, then UI)
pnpm run test         # Run all tests (vitest)
pnpm run test:watch   # Watch mode
pnpm run lint         # ESLint
pnpm run format:check # Prettier check
pnpm run format       # Prettier fix
```

Protocol must be built before UI (`pnpm run build:protocol`). The full `build` script handles this.

## CI Pipeline

GitHub Actions (`.github/workflows/deploy.yml`) runs on push to main and PRs:

1. Install → Audit → Lint → Format check → Build protocol → Test → Build UI → Lighthouse CI → Deploy

Tests and lint gate deployment. Lighthouse enforces accessibility >= 0.9 (error) and performance >= 0.8 (warn).

Production deploys on push to main. PRs get preview URLs commented automatically.

## Architecture

**Protocol layer** (`packages/protocol/src/`):
- `webhid-transport.ts` — WebHID adapter, filters by vendor usage page (0xFF00)
- `device-base.ts` — 64-byte HID feature report send/receive with retry
- `controller.ts` — Normal mode: device info, SWD commands, haptics, jingles
- `bootloader.ts` — Bootloader mode: erase, flash, verify (CRC-128)
- `flash-coordinator.ts` — Orchestrates full flash sequences with mode switching
- `firmware.ts` — Firmware set constructors (BLE and Production)

**UI layer** (`packages/ui/src/`):
- `main.tsx` — Entry point, header, footer, unsupported browser check, easter egg
- `App.tsx` — Page router with lazy-loaded pages, state management, HID event handling
- `hooks/useFlashCoordinator.ts` — Firmware loading with CDN → ZIP → local fallback chain
- `hooks/useHIDEvents.ts` — WebHID connect/disconnect detection
- `utils/firmware-sources.ts` — Declarative firmware source config (easy to update URLs)
- `i18n/` — Translations: en, zh, es, fr

**Page flow**: Connect → Home → Choose Firmware → Preflight → Flashing → Complete

## Key Technical Details

- **Two USB modes**: Normal (PID 0x1102) and Bootloader (PID 0x1002). Flash sequences switch between them, requiring user to re-grant WebHID permission via `requestDevice()`.
- **Reconnect resolver**: Stored in `useRef` (not `useState` — React treats function values as state updaters).
- **Lazy imports**: Wrapped with `lazyWithReload()` to handle stale chunks after deploys.
- **Firmware sources**: Three-tier fallback: Valve CDN (HTTPS) → Valve ZIP (fflate extraction) → local bundle. ZIP is cached in memory.
- **Firmware size validation**: Rejects files < 10KB or > 500KB.

## Testing

Vitest workspace with two projects:
- **protocol** — Node environment, tests HID protocol logic with `MockHIDTransport`
- **ui** — jsdom environment, React Testing Library, setup file at `tests/setup.ts`

Tests require `// @vitest-environment jsdom` comment in UI test files for proper environment detection.

## Code Style

- **Prettier**: Single quotes, trailing commas, 120 char width
- **ESLint**: TypeScript recommended rules, unused vars prefixed with `_`
- **CSS**: No CSS-in-JS. Single `style.css` with CSS custom properties. See `Design.md` for the full design system.
- **Buttons**: Ghost for most actions, blue for flow-advancing, green only for "Begin Flash"
- **i18n**: All user-facing strings use translation keys via `useTranslation()`

## Before Committing

- Always run `pnpm run format` before committing. Prettier formatting is enforced in CI and will fail the build if files aren't formatted.
- Run `pnpm run lint` to catch errors. Warnings are allowed but errors will fail CI.

## Things to Know

- The `Design.md` file is the source of truth for colors, spacing, typography, and component patterns. Keep it updated when changing visual elements.
- Accessibility: all interactive elements need `focus-visible` outlines. Color contrast must meet WCAG AA 4.5:1 against `--bg: #0e141b`.
- The easter egg (Konami code) dispatches a `CustomEvent('easter-egg')` that App.tsx listens for to play the Triumph jingle on connected controllers.
- No PWA/service worker — the tool requires USB + browser, offline mode is useless.
- GPL-2.0 license. Derived from [SteamControllerTool](https://github.com/lilphil/SteamControllerTool) (Python, GPL-2.0).
