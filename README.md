<h1 align="center">Peeky</h1>

<p align="center">
  <img src="chrome/static/icon128.png" alt="Peeky!">
</p>

> Preview links in a minimal floating overlay with Shift+Click, inspired by Arc browser's Peek feature.

Peeky is a clean, stripped-down, performance-focused fork of [BerryPeek](https://github.com/Kain-90/BerryPeek). It keeps the core — Shift+Click any link to preview it in a floating iframe — and removes the rest: no header bar, no theming, no drag/resize, no animations.

## Supported browsers

Works with any Chromium-based browser (Helium, Chrome, Edge, Brave, Opera, Arc, Comet, etc.).

## Features

pt+W) 
- **Shift+Click** any link to open it in a centred floating preview
- **Enter** or the top button promotes the preview to a real new tab
- **Esc**, the X button, or clicking the dimmed backdrop dismisses the preview
- **Alt+W** (Opt+W) closes the preview from anywhere (works even when focus is inside the previewed page)
- **Alt+O** (Opt+O) opens the preview as a real tab from anywhere
- Smart `X-Frame-Options` detection — if a site can't be framed, it opens in a new tab automatically
- Minimal UI: just the iframe, two circular action buttons, and a faint dimmed backdrop

## Installation (from source)

1. Clone this repository:
   ```bash
   git clone <your-fork-url>.git
   cd Peek
   ```

2. Open your browser's extensions page:
   - Helium: `helium://extensions/`
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
   - Opera: `opera://extensions/`

3. Enable **Developer mode** (top-right toggle).

4. Click **Load unpacked** and select the `chrome/` directory inside this project.

5. Done. Open any page and Shift+Click a link to try it.

To update later, pull the latest changes and press the reload button on the extension card.

## Usage

1. Hold `Shift` and click any link.
2. The linked page loads in a floating overlay.
3. Press `Enter` or click the upper button to open it as a full tab; press `Esc`, click the lower button, or click the dimmed area to dismiss.

If you click into the previewed page, keyboard focus moves there and `Esc`/`Enter` won't reach the overlay (this is a browser-enforced security boundary on cross-origin iframes). Use `Alt+W` (`Opt+W`) to close or `Alt+O` (`Opt+O`) to open as a tab from any focus state. The shortcuts can be rebound in `chrome://extensions/shortcuts`.

## Project structure

```
chrome/
├── manifest.json   # Extension configuration (MV3)
├── background.js   # Service worker — checks X-Frame-Options
├── content.js      # Detects Shift+Click, builds the overlay
├── content.css     # Overlay styles
├── iframe.html     # Inner-iframe shell
├── iframe.js       # Loads the target URL inside the overlay iframe
├── iframe.css      # Styles for the inner-iframe error state
├── rules.json      # declarativeNetRequest — strips frame-blocking headers
└── static/         # Icons (open.svg, close.svg, icon.png)
```

## X-Frame-Options handling

Peeky checks each URL against the background service worker before showing it. The check runs in parallel with the iframe render, so it doesn't slow things down. If the site blocks framing (`X-Frame-Options: deny`, or a cross-origin `sameorigin`), Peeky dismisses the overlay and opens the link in a new tab instead.

## Acknowledgments

- Forked from [BerryPeek](https://github.com/Kain-90/BerryPeek) by Kain-90.
- Inspired by [Arc browser's Peek feature](https://resources.arc.net/hc/en-us/articles/19335302900887-Peek-Preview-Sites-From-Pinned-Tabs) by The Browser Company.

## License

[MIT License](LICENSE).
