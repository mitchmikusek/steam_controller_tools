# Steam Controller Flash Tool

Web-based firmware flash tool for the original Steam Controller (2015) using the WebHID API. Flash BLE (Bluetooth) firmware to use your controller wirelessly without the USB dongle.

## Features

- **One-click BLE firmware flash** with progress tracking
- **Revert to production** (non-BLE) firmware
- **Device info** display with firmware revision dates
- **Extras**: haptic buzz, LED brightness, 14 built-in jingles, reset settings
- **Custom firmware** file picker for advanced users
- **Real-time log** panel

## Requirements

- **Browser**: Chrome, Edge, or Vivaldi (WebHID required — Firefox/Safari not supported)
- **USB**: Steam Controller connected via USB cable
- **Linux**: udev rule for HID access (Steam installs this automatically):
  ```
  KERNEL=="hidraw*", ATTRS{idVendor}=="28de", MODE="0660", TAG+="uaccess"
  ```

## Quick Start

```bash
# Enter dev environment
nix-shell

# Install dependencies
pnpm install

# Start dev server
pnpm run dev
```

Open http://localhost:5173 in Chrome/Vivaldi.

## Build

```bash
# Build protocol library + web UI
pnpm run build

# Output in packages/ui/dist/ — serve as static files
```

## Firmware Files

Firmware binaries are not included in the repo. Place them in `packages/ui/public/fw_images/`:

```
fw_images/
├── ble/
│   ├── vcf_wired_controller_d0g_5b0f21bd.bin  (LPC, May 2018)
│   ├── s110_nrf51_8.0.0_softdevice.bin         (Nordic BLE stack)
│   └── vcf_wired_controller_d0g_5a0e3f348_radio.bin (Radio, Nov 2017)
└── production/
    ├── vcf_wired_controller_d0g.bin            (LPC)
    ├── d0g_bootloader.bin                      (Bootloader)
    └── d0g_module.bin                          (Radio)
```

BLE firmware can be downloaded from Valve's CDN:
```
http://media.steampowered.com/controller_config/firmware/vcf_wired_controller_d0g_5b0f21bd.bin
http://media.steampowered.com/controller_config/firmware/vcf_wired_controller_d0g_5a0e3f348_radio.bin
```

The SoftDevice and production firmware are in [Valve's FW Update Tool ZIP](https://steamcdn-a.akamaihd.net/steamcommunity/public/images/steamworks_docs/english/Steam_Controller_FW_Update_Tool.zip).

## Architecture

```
packages/
├── protocol/   # Core HID protocol library (TypeScript, zero UI deps)
│               # Ported from Python SteamControllerTool
└── ui/         # Web app (Vite + vanilla TypeScript)

apps/
└── desktop/    # Electron wrapper (scaffolded, shares web UI)
```

## Credits

- **[SteamControllerTool](https://github.com/lilphil/SteamControllerTool)** by lilphil — the Python tool this project ports from. All HID protocol knowledge and flash sequences originate from this project.
- **[OpenSteamController](https://github.com/greggersaurus/OpenSteamController)** by greggersaurus — reverse engineering of the Steam Controller hardware and firmware protocol that made SteamControllerTool possible.
- **[Valve](https://www.valvesoftware.com/)** — firmware binaries and the original Steam Controller FW Update Tool.
- **[Nordic Semiconductor](https://www.nordicsemi.com/)** — S110 SoftDevice BLE stack for the nRF51822 radio chip.
- Built with [Claude Code](https://claude.ai/code) by Anthropic.

## License

GPL-2.0 (matching SteamControllerTool)
