# Design System

Steam Controller (2015) Firmware Flash Tool — UI design reference.

Inspired by the Steam Deck Big Picture mode aesthetic: dark, minimal, spacious, console-friendly.

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0e141b` | Page background |
| `--bg-card` | `rgba(255,255,255,0.03)` | Card/section backgrounds |
| `--bg-card-hover` | `rgba(255,255,255,0.06)` | Hover/selected states |
| `--border` | `rgba(255,255,255,0.06)` | Default borders, dividers |
| `--border-hover` | `rgba(255,255,255,0.12)` | Hover borders |
| `--text` | `#b8bcbf` | Body text |
| `--text-bright` | `#e1e3e5` | Headings, emphasis |
| `--text-dim` | `#5a6069` | Labels, secondary text |
| `--blue` | `#1a9fff` | Primary actions, active states, links |
| `--green` | `#59bf40` | Success, confirmations, critical "go" actions |
| `--red` | `#d94126` | Errors, destructive actions |
| `--yellow` | `#e8a43a` | Warnings |

### Color Rules

- **Primary navigation actions** (Next, Reconnect, Return Home): `--blue`
- **Critical/irreversible actions** (Begin Flash): `--green`
- **Secondary/dismissive actions** (Disconnect, Back, Close, test buttons): ghost style
- **Status indicators**: green = connected/pass, red = error/fail, yellow = warning, blue = active/in-progress
- **Step progress dots**: green = done, blue = active, red = error, default = upcoming

## Typography

| Level | Size | Weight | Color | Usage |
|-------|------|--------|-------|-------|
| App title | 1.1rem | 500 | `--text-bright` | Header "STEAM CONTROLLER (2015)" |
| App subtitle | 0.7rem | 400 | `--text-dim` | Header "FIRMWARE FLASH TOOL" |
| Page heading | 1rem | 300 | `--text-bright` | "CHOOSE FIRMWARE", etc. |
| Section title | 0.7rem | 600 | `--text-dim` | "CONTROLLER", "EXTRAS", "SUMMARY" |
| Row label | 0.85rem | 400 | `--text-bright` | Setting/info row labels |
| Row sublabel | 0.7rem | 400 | `--text-dim` | Descriptions under labels |
| Row value | 0.7rem | 400 | `--text` | Monospace data values |
| Body text | 0.8rem | 400 | `--text` | General content |
| Small text | 0.65rem | 400 | `--text-dim` | Log output, file labels |
| Badge | 0.55rem | 700 | varies | "BLE", "INSTALLED" pills |
| Disclaimer | 0.6rem | 400 | `rgba(255,255,255,0.15)` | Footer legal text |

### Font stacks

- **UI**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- **Monospace** (data values, log, error messages): `'Consolas', 'SF Mono', monospace`

### Text conventions

- Section titles: uppercase, letter-spacing 0.1em
- App header: uppercase, letter-spacing 0.12em
- Page headings: uppercase, letter-spacing 0.04em, weight 300
- Body text: sentence case
- Use CSS classes (`.page-heading`, `.section-title`, `.card-title`, `.modal-title`) — avoid inline font styles

### Log colors

Log lines should be readable but not distracting:

| Level | Color | Usage |
|-------|-------|-------|
| `debug` | `#3a3f47` | Nearly invisible, internal diagnostics |
| `info` | `--text` (`#b8bcbf`) | Neutral — normal operation messages |
| `warn` | `--yellow` (`#e8a43a`) | Attention needed but not fatal |
| `error` | `--red` (`#d94126`) | Failures, action required |

Info should NOT be blue — blue implies interactivity. Log text is read-only.

## Spacing Scale

Use only these values for margins, padding, and gaps:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps (badge padding, subtitle margin) |
| sm | 8px | Small gaps (between related elements) |
| md | 12px | Card/section row padding, card margins |
| lg | 16px | Section padding, card padding, modal gaps |
| xl | 24px | Section margins, modal padding |
| 2xl | 32px | Page header padding |
| 3xl | 48px | Flash center area padding |

## Buttons

### Variants

Steam uses neutral buttons for almost everything, with color reserved for emphasis.

| Class | Background | Color | Usage |
|-------|-----------|-------|-------|
| `.btn-ghost` | transparent, outlined | `--text-dim` | Default button style. Most actions use this: Connect, Disconnect, Next, haptics, jingles, modal close, View BLE Modes |
| `.btn-blue` | `--blue` | white | Confirmation actions that advance the flow: Flash Firmware (home), Reconnect (modal), Return Home |
| `.btn-green` | `--green` | white | Critical/irreversible actions only: Begin Flash |

### Sizes

| Class | Font size | Padding | Radius | Usage |
|-------|-----------|---------|--------|-------|
| (default) | 0.8rem | 8px 20px | 20px | Standard buttons |
| `.btn-sm` | 0.7rem | 5px 14px | 20px | Compact buttons in rows (haptics, jingles, Connect) |
| `.btn-block` | inherits | inherits | inherits | Full width modifier |

`btn-lg` exists but should be used sparingly — prefer standard size.

### Rules

- **Most buttons are ghost** — matches Steam's neutral button aesthetic
- **Blue for flow-advancing confirmations** — "Flash Firmware", "Reconnect", "Return Home"
- **Green only for point-of-no-return** — "Begin Flash"
- One colored button per page section maximum
- Ghost for anything dismissive, secondary, or exploratory
- Never mix sizes for buttons in the same row
- All CTAs at bottom-right of their section (except `.btn-block`)

## Text Hierarchy

Pages follow a consistent heading structure:

```
App Header (always visible)
├── h1: "STEAM CONTROLLER (2015)"    — 1.1rem, weight 500, uppercase
└── subtitle: "FIRMWARE FLASH TOOL"  — 0.7rem, uppercase

Page Content
├── .page-heading: "CHOOSE FIRMWARE" — 1rem, weight 300, uppercase (wizard steps only)
├── .section-title: "CONTROLLER"     — 0.7rem, weight 600, uppercase, with bottom border
│   └── .section-row
│       ├── .section-row-label       — 0.85rem, --text-bright
│       └── .section-row-value       — 0.7rem, monospace, --text
├── .card-title: "RESULT"            — 0.65rem, weight 600, uppercase
├── .flash-status: "Flashing radio"  — 0.85rem, --text-bright (centered, flashing page)
├── .result-title: "Flash Complete"  — 0.9rem, weight 400, --text-bright (centered, complete page)
└── .modal-title: "BLE Modes"        — 1.1rem, weight 500, --text-bright (modal dialogs)
```

### Rules

- Wizard step pages (Choose, Preflight) always have a `.page-heading`
- Home page uses `.section-title` directly (no page heading — it IS the home)
- Centered pages (Flashing, Complete) use their own centered title styles
- Never use inline font styles — use the defined CSS classes
- Section titles always uppercase with letter-spacing

## Layout Components

### Connection Bar (`.conn-bar`)
Top of home page. Flex row: status dot + status text + action button.

### Section (`.section`)
Steam Deck settings-style layout. Contains:
- `.section-title` — uppercase header with bottom border
- `.section-row` — flex row with label left, value/control right, bottom border between rows

### Card (`.card`)
Bordered container with `.card-title`. Used for standalone content blocks (preflight results, complete page details).

### Select Card (`.select-card`)
Clickable bordered card with `.selected` state (blue border + tinted background). Used in firmware selection.

### Flash Center (`.flash-center`)
Centered flex column for the flashing page. Contains the logo ring, status text, progress bar.

### Logo Ring (`.logo-ring`)
100px circle with spinning blue arc. States: default (spinning), `.complete` (green, static), `.error` (red, static).

### Modal (`.modal-overlay` + `.modal`)
Full-screen backdrop blur overlay. Centered dialog box. Used for reconnect prompts and BLE help.

## Step Progress Indicator (`.steps`)

Four dots across the top of wizard pages:
- Page 1 (Choose Firmware): dot 1 active
- Page 2 (Preflight): dot 1 done, dot 2 active
- Page 3 (Flashing): dots 1-2 done, dot 3 active
- Page 4 (Complete): all done (green) or last one error (red)

## Page Flow

```
Home ──> Choose Firmware ──> Preflight ──> Flashing ──> Complete
  ^                                                        │
  └────────────────────────────────────────────────────────┘
```

- Back navigation: browser back or back link (blocked during flashing)
- `beforeunload` guard during flashing
- Browser history via `pushState`

## Icons and Assets

| Asset | File | Usage |
|-------|------|-------|
| Steam logo (white) | `steam-logo.png` | Flashing page spinner, BLE help modal |
| Steam pixel logo | `steam-pixel.png` | Reserved for future use |

## Known Patterns

### BLE Help Content
Reusable via `createBleHelpContent()` from `ble-help-modal.ts`. Renders inline on complete page, as modal from home page. Button circles use outline style with colored borders matching controller face buttons (Y=yellow, B=red, X=blue, A=green).

### Firmware Type Detection
Uses known BLE firmware timestamps (`0x5b0f21bd`, `0x58be1e97`) and heuristic (rev > `0x5a000000` = BLE). Displayed as badges: `.badge-ble` (green), `.badge-prod` (gray), `.badge-unknown` (red).

### Device Info Display
Firmware revisions shown as `0xhexvalue` with date on hover (via `title` attribute). Uses monospace font in section row values.
