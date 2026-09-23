# TrailKit — Browser Toolkit

A unified, static website that brings together useful browser-compatible concepts from seven open-source repositories into a single, polished multi-tool application.

## Description

TrailKit is a client-side toolkit for outdoor navigation, weather, image/PDF conversion, speech transcription, developer utilities, and currency conversion. It runs entirely in the browser — no backend, no build step, no installation required.

The project adapts concepts from seven reference repositories into a single coherent product. Every feature presented as functional genuinely works in a modern browser, and every browser limitation is documented honestly.

## Features

- **Outdoor & Navigation** — Distance & bearing calculator, sunrise/sunset estimator, altitude estimator from pressure
- **Weather** — Current conditions and 7-day forecast via Open-Meteo (free, no API key)
- **Image Toolkit** — Resize, compress, convert format, rotate, crop, and inspect images locally
- **Images to PDF** — Combine multiple images into a single PDF with reordering and page options
- **Speech to Text** — Live microphone transcription via the Web Speech API
- **Developer Utilities** — Hash generator, UUID, Base64, JSON formatter, unit converter, QR code generator
- **Currency Converter** — Convert between 200+ currencies via Frankfurter API v2 (free, no key)
- **Dark/Light Theme** — Persisted in localStorage, respects system preference
- **Responsive** — Works on desktop, tablet, and mobile
- **Accessible** — Semantic HTML, keyboard navigation, focus states, ARIA attributes
- **Privacy First** — Files processed locally; no tracking, no analytics, no cookies

## Tools Included

| Tool | Category | Processing |
|------|----------|------------|
| Distance & Bearing Calculator | Outdoor | Local |
| Sunrise & Sunset | Outdoor | Local |
| Altitude Estimator | Outdoor | Local |
| Weather Forecast | Weather | Open-Meteo API |
| Image Resize/Compress/Convert/Rotate/Crop | Image | Local (Canvas) |
| Images to PDF | PDF | Local (jsPDF) |
| Speech to Text | Speech | Browser Web Speech API |
| Hash Generator | Utilities | Local (Web Crypto) |
| UUID Generator | Utilities | Local |
| Base64 Encoder/Decoder | Utilities | Local |
| JSON Formatter | Utilities | Local |
| Unit Converter | Utilities | Local |
| QR Code Generator | Utilities | Local (qrcode-generator) |
| Currency Converter | Utilities | Frankfurter API v2 |

## Technology Stack

- **HTML5** — semantic, accessible markup
- **CSS3** — custom design system, responsive layout, CSS animations
- **Vanilla JavaScript** — modular, no framework dependencies
- **Web APIs** — Canvas, Web Crypto, Web Speech, File, Fetch, localStorage
- **External CDN libraries** — jsPDF (PDF generation), qrcode-generator (QR codes)
- **No build system** — deploy directly from source files

## Folder Structure

trailkit/
├── index.html
├── README.md
├── LICENSE
├── assets/
│ ├── css/
│ │ ├── style.css
│ │ ├── responsive.css
│ │ └── animations.css
│ ├── js/
│ │ ├── app.js
│ │ ├── theme.js
│ │ ├── navigation.js
│ │ ├── outdoor.js
│ │ ├── weather.js
│ │ ├── image-tools.js
│ │ ├── pdf-tools.js
│ │ ├── speech.js
│ │ └── utilities.js
│ └── images/
│ └── logo.svg
└── pages/
├── outdoor.html
├── weather.html
├── image-tools.html
├── pdf-tools.html
├── speech.html
├── utilities.html
└── about.html


## Local Setup

No build step is required. Simply open `index.html` in a modern browser, or serve the folder with any static file server:

```bash
# Python 3
python -m http.server 8000

# Node.js (if you have npx)
npx serve .

# PHP
php -S localhost:8000
```
## Netlify Deployment

Drag and drop the project folder onto app.netlify.com/drop.

Or connect your Git repository and set the publish directory to the project root (no build command).

##Vercel Static Deployment

Import the project into vercel.com.

Set the framework preset to Other.

Leave the build command empty and set the output directory to the project root (.).

## Cloudflare Pages Deployment

Go to Pages → Create a project.

Connect your Git repository.

Set the build output directory to the project root (.).

No build command is needed.

## External Dependencies

Dependency	Version	Purpose	License	Source
jsPDF	2.5.2	PDF generation	MIT	cdnjs.cloudflare.com
qrcode-generator	1.4.4	QR code generation	MIT	jsDelivr
Both are loaded over HTTPS from public CDNs. If the CDN is unavailable, the affected tool shows a clear error message and the rest of the site continues to function normally.

## API Requirements

API	Used By	Key Required?	Notes
Open-Meteo	Weather	No	Free, open-source weather API (geocoding + forecast)
Frankfurter v2	Currency Converter	No	Free, no-key exchange rate API (ECB + 98 central banks, 200+ currencies)
No secret API keys are included or required. No API keys are stored in the repository. No environment variables are needed.

## Browser Requirements

Modern browser: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

Web Speech API (Speech to Text): Chrome, Edge, Safari. Not supported in Firefox.

Web Crypto API (Hash Generator): All modern browsers

Canvas API (Image Tools): All modern browsers

File API & Drag/Drop (Image/PDF Tools): All modern browsers

localStorage (Theme, Weather location): All modern browsers

Clipboard API (Copy buttons): Requires HTTPS or localhost in most browsers

## Privacy

Images & PDFs are processed entirely in the browser using the Canvas API and jsPDF. Files are never uploaded to any server.

Speech is handled by the browser's Web Speech API. Depending on the browser, audio may be processed by the browser vendor's cloud service (e.g., Google for Chrome). TrailKit does not record, store, or transmit audio.

Weather search queries are sent to Open-Meteo's geocoding service. Weather data is fetched directly from Open-Meteo.

Currency conversion uses the Frankfurter API v2. No personal data is sent.

localStorage stores only the theme preference and the last weather location. You can clear these at any time via your browser settings.

No analytics, cookies, or tracking scripts of any kind.

## Security

No shell command execution. No eval(). No dynamic code generation from user input.

No secret API keys included or required.

File uploads are validated by MIME type and size (25 MB limit) before processing.

External dependencies are minimal, pinned to specific versions, and loaded over HTTPS.

All user input is validated before processing. Errors are caught and shown as user-friendly messages.

Relative paths are used throughout for GitHub Pages subpath compatibility.

## Known Limitations

No native sensor access: Browsers cannot access phone barometers, magnetometers, or GPS with the same fidelity as a native Android app. The altitude estimator requires manual pressure input. The compass uses the device orientation API where available.

Speech recognition: The Web Speech API is not supported in Firefox. Chrome, Edge, and Safari use the browser vendor's speech service. whisper.cpp WASM integration would require model files (75 MB–1.5 GB) and WASM builds, which are not included by default.

Weather: Requires an internet connection. Open-Meteo is a third-party service; if it is unavailable, the weather tool shows an error.

Currency: Rates are updated daily by the source providers. Intra-day fluctuations are not reflected. The Frankfurter v1 API is frozen; TrailKit uses v2.

PDF generation: Very large images (many pages × high resolution) may consume significant memory. jsPDF converts images to JPEG internally, which may slightly reduce quality for transparent PNGs.

whisper.cpp: The original native implementation requires binaries, WASM, and model files. TrailKit uses the Web Speech API as a functional, zero-install alternative and documents the additional assets required for full whisper.cpp integration.

OS swap management: The reference repository florianv/swap is a PHP currency conversion library (not an OS swap manager). TrailKit implements browser-based currency conversion — no fake system modifications.

## Credits

This project was inspired by the following open-source repositories. No code was copied directly; all implementations are independent browser adaptations of the underlying concepts.

Trail Sense — Kyle Corry (MIT License)

AIC Weather Forecasting — fengyang95 (MIT License)

Images-to-PDF — Swati4star

MultiMian ImageKit — Mianhassam96

whisper.cpp — ggml-org (MIT License)

Bash-Snippets — alexanderepstein (MIT License)

swap — florianv (MIT License)

WinScript — flick9000 (design inspiration)

Bootstrap — design reference

Tailwind CSS — design reference

Open-Meteo — free weather API

Frankfurter — free exchange rate API

jsPDF — PDF generation library (MIT)

qrcode-generator — QR code library (MIT)

## License Information

TrailKit is released under the MIT License. See the LICENSE file for details.

The original repositories referenced above have their own licenses:

Trail Sense — MIT License

AIC Weather Forecasting — MIT License

whisper.cpp — MIT License

Bash-Snippets — MIT License

swap — MIT License

Images-to-PDF — See repository for current license

MultiMian ImageKit — See repository for current license

No code from these repositories was copied directly. All implementations are independent browser adaptations of the underlying concepts. Attribution is provided in the About page and in this README.

## Implementation Status

Fully Functional
These features genuinely work in the static browser implementation:

✅ Distance & bearing calculator (Haversine distance, initial bearing, compass direction)

✅ Sunrise/sunset estimator (NOAA simplified solar position algorithm)

✅ Altitude estimator from barometric pressure

✅ Weather search via geocoding, current conditions, 7-day forecast (Open-Meteo)

✅ Image load, preview, info display (dimensions, format, size, aspect ratio, megapixels)

✅ Image resize with custom dimensions and PNG download

✅ Image compress & convert (JPEG/WebP/PNG with quality slider)

✅ Image rotate (90°, 180°, 270°, -90°)

✅ Image crop (custom x/y/width/height with bounds checking)

✅ Images to PDF (multiple images, drag/drop, preview, reorder, remove, clear all)

✅ PDF page size (A4, Letter, Fit-to-image), orientation, margin, custom file name

✅ Speech to text (Web Speech API — Chrome, Edge, Safari) with copy and .txt download

✅ Hash generator (MD5, SHA-1, SHA-256, SHA-512 via Web Crypto)

✅ UUID v4 generator (1–50 at a time, copy to clipboard)

✅ Base64 encode/decode (UTF-8 safe)

✅ JSON format/minify with clear error messages

✅ Unit converter (length, mass, temperature, area, volume, speed, data)

✅ QR code generator (128/256/512 px, PNG download)

✅ Currency converter (Frankfurter API v2, 200+ currencies)

✅ Dark/light theme toggle with localStorage persistence and system preference detection

✅ Responsive mobile navigation (hamburger menu)

✅ Homepage tool search and category filtering

✅ Scroll-reveal animations (respects prefers-reduced-motion)

✅ All reset/clear buttons functional

✅ Error handling for empty/invalid inputs across all tools

✅ Duplicate detection for PDF image list

✅ File type and size validation for image uploads

## Contributing

This project is a self-contained static website. Contributions are welcome for:

Bug fixes

Additional browser-compatible tools

Accessibility improvements

Documentation improvements

Additional language support

When contributing, please maintain the existing architecture:

Keep every file separate and logically organized

Do not add build steps or server dependencies

Do not add unnecessary dependencies

Document any external API usage clearly

Preserve attribution to the original reference repositories
