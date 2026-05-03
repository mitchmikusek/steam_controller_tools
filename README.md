# Steam Controller Flash Tool

**Unlock Bluetooth on your Steam Controller.**

Flash BLE firmware onto your original Steam Controller (2015) directly from your browser — no downloads, no installs. Uses the [WebHID API](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API) to communicate with the controller over USB.

[**Try it live →**](https://steamcontroller.tools)

## Features

- **One-click Bluetooth flash** — adds BLE support while keeping dongle compatibility
- **Revert to production** firmware anytime
- **Pre-flight checks** — validates browser, connection, and firmware before flashing
- **Step-guided wizard** — choose firmware → preflight → flash → done
- **Controller extras** — haptic test, LED brightness, 14 built-in jingles
- **BLE mode guide** — button combos for switching between Bluetooth and dongle
- **Multi-language** — English, 中文, Español, Français
- **Bundled firmware** — all firmware included locally, no external downloads

## How It Works

The Steam Controller has two chips: an LPC11U37F (main processor) and an nRF51822 (radio). The original firmware only supports Valve's proprietary wireless dongle. In 2018, Valve released a BLE firmware update that adds Bluetooth Low Energy support.

This tool ports the [SteamControllerTool](https://github.com/lilphil/SteamControllerTool) Python flashing protocol to TypeScript and runs it entirely in the browser via WebHID:

1. **Connect** — plug in controller via USB, grant WebHID permission
2. **Flash LPC** — write main firmware via bootloader mode
3. **Flash Radio** — write BLE stack to nRF51822 via SWD (Serial Wire Debug)
4. **Done** — controller chimes, Bluetooth ready (Steam+Y to pair)

## Requirements

| Requirement | Details |
|---|---|
| **Browser** | Chrome, Edge, or Vivaldi (WebHID required) |
| **Controller** | Original Steam Controller (2015) connected via USB |
| **Linux** | udev rule for HID access (Steam installs this automatically) |

## Quick Start

```bash
# Clone
git clone https://github.com/mitchmikusek/steam_controller_tools.git
cd steam_controller_tools

# Install (requires Node.js 22+ and pnpm)
pnpm install

# Dev server
pnpm run dev

# Production build
pnpm run build
# Output: packages/ui/dist/
```

Or use the Nix shell: `nix-shell -p pnpm nodejs`

## Architecture

```
packages/
├── protocol/           # HID protocol library (TypeScript, zero UI deps)
│   └── src/
│       ├── constants.ts        # Protocol IDs, device PIDs
│       ├── controller.ts       # Normal mode: info, SWD, haptics, jingles
│       ├── bootloader.ts       # Bootloader mode: erase, flash, verify
│       ├── flash-coordinator.ts # Orchestrates full flash sequences
│       ├── webhid-transport.ts  # WebHID adapter
│       └── checksum.ts         # CRC-128 verification
│
└── ui/                 # React web app (Vite)
    └── src/
        ├── App.tsx             # Page router, state management
        ├── pages/              # 6 lazy-loaded page components
        ├── components/         # Shared UI (Modal, Badge, ProgressBar, etc.)
        ├── hooks/              # useFlashCoordinator, useHIDEvents
        ├── i18n/               # Translation files (en, zh, es, fr)
        └── utils/              # Firmware detection, logging, source config
```

## Tech Stack

| Layer | Technology |
|---|---|
| **UI** | React 19, TypeScript, Vite |
| **Protocol** | TypeScript, WebHID API |
| **Styling** | CSS (Steam Deck-inspired dark theme) |
| **i18n** | react-i18next (4 languages) |
| **Error Tracking** | Sentry |
| **Analytics** | Cloudflare Web Analytics |
| **Hosting** | Cloudflare Pages |
| **CI/CD** | GitHub Actions |

## Firmware Sources

All firmware files are bundled locally in the app. Valve's CDN and ZIP sources lack CORS headers and cannot be fetched from a browser.

Configuration: [`packages/ui/src/utils/firmware-sources.ts`](packages/ui/src/utils/firmware-sources.ts)

## BLE Controller Modes

After flashing BLE firmware, use these button combos:

| Combo | Mode |
|---|---|
| **Steam + Y** | Bluetooth LE pairing |
| **Steam + B** | Switch to Bluetooth LE mode |
| **Steam + X** | Dongle pairing |
| **Steam + A** | Switch to dongle mode |

## Contributing

Contributions welcome! This project is open source under GPL-2.0.

- **Translations** — machine-translated, native speaker improvements welcome
- **Bug reports** — [open an issue](https://github.com/mitchmikusek/steam_controller_tools/issues)
- **Protocol improvements** — the `packages/protocol` library is framework-agnostic

## Credits

- **[SteamControllerTool](https://github.com/lilphil/SteamControllerTool)** by lilphil — Python tool this project ports from
- **[OpenSteamController](https://github.com/greggersaurus/OpenSteamController)** by greggersaurus — reverse engineering of the Steam Controller hardware and firmware protocol
- **[Valve](https://www.valvesoftware.com/)** — firmware binaries and the original Steam Controller FW Update Tool
- **[Nordic Semiconductor](https://www.nordicsemi.com/)** — S110 SoftDevice BLE stack for the nRF51822 radio chip
- Built with [Claude Code](https://claude.ai/code) by Anthropic

## Legal

This project is not affiliated with Valve Corporation. Steam® and the Steam logo are trademarks and/or registered trademarks of Valve Corporation in the U.S. and/or other countries.

## License

[GPL-2.0](LICENSE.md)
