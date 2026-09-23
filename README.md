# TrailKit — Browser Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Zero Build](https://img.shields.io/badge/Build-Zero%20Config%20%2F%20Static-green.svg)](#local-setup)
[![Platform: Browser](https://img.shields.io/badge/Platform-Web%20Standards-orange.svg)](#browser-compatibility)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Client--Side-brightgreen.svg)](#privacy--security)

TrailKit is a cohesive, static web application that consolidates browser-compatible utilities for outdoor navigation, weather forecasting, image and PDF manipulation, live speech transcription, developer workflows, and currency exchange into a single zero-dependency product.

The platform runs 100% client-side with no backend infrastructure, build systems, or installation steps required. Every tool operates directly on standard Web APIs and documented open services.

---

## Table of Contents

- [Key Features](#key-features)
- [Tools Catalog](#tools-catalog)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [External Dependencies & APIs](#external-dependencies--apis)
- [Browser Compatibility](#browser-compatibility)
- [Privacy & Security](#privacy--security)
- [Known Limitations](#known-limitations)
- [Attribution & Credits](#attribution--credits)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

* **Zero Build Step:** Serve directly from standard source files via any static web server or host.
* **100% Client-Side Privacy:** Files and data are processed locally via Canvas, Web Crypto, and client runtime; no personal data or files are sent to remote servers.
* **Universal Responsiveness:** Fully accessible interface with keyboard navigation, ARIA attributes, semantic HTML, and adaptive layouts across mobile, tablet, and desktop.
* **System-Aware Theme Engine:** Smooth light/dark mode transitions with automatic system preference detection and `localStorage` persistence.
* **Honest Browser Support:** Clear boundary separation between client-supported features and platform limitations.

---

## Tools Catalog

| Category | Tool | Underlying Engine / Source | Local / Remote |
| :--- | :--- | :--- | :--- |
| **Outdoor** | Distance & Bearing Calculator | Haversine formula & initial bearing algorithms | Local |
| **Outdoor** | Sunrise & Sunset Estimator | NOAA simplified solar position algorithm | Local |
| **Outdoor** | Altitude Estimator | Barometric pressure equations | Local |
| **Weather** | 7-Day Forecast & Geocoding | Open-Meteo REST API | Remote (No-key API) |
| **Media** | Image Editor & Converter | HTML5 Canvas API (Resize, compress, crop, rotate, inspect) | Local |
| **Media** | Images to PDF Converter | `jsPDF` library with drag/drop page sorting and sizing | Local |
| **Speech** | Speech to Text Transcription | Web Speech Recognition API with TXT export | Browser engine |
| **Developer** | Cryptographic Hash Generator | Web Crypto API (MD5, SHA-1, SHA-256, SHA-512) | Local |
| **Developer** | UUID Generator | RFC4122 v4 generator (batch size 1–50) | Local |
| **Developer** | Base64 Encoder / Decoder | UTF-8 compliant Base64 pipeline | Local |
| **Developer** | JSON Formatter & Minifier | Native JSON parser with error highlighting | Local |
| **Developer** | Unit Converter | Multi-metric unit conversion (length, mass, temp, volume, speed, data) | Local |
| **Developer** | QR Code Generator | `qrcode-generator` engine with custom resolution and download | Local |
| **Finance** | Currency Converter | Frankfurter API v2 (European Central Bank data, 200+ currencies) | Remote (No-key API) |

---

## Technology Stack

* **Markup & Structure:** Semantic HTML5 with focus management and ARIA accessibility roles.
* **Styling:** Modular CSS3 custom properties (variables), Flexbox, CSS Grid, and motion-safe CSS transitions (`prefers-reduced-motion`).
* **Logic:** Vanilla JavaScript (ES6+), zero external runtime frameworks.
* **Standard Web APIs:** HTML5 Canvas, Web Crypto, Web Speech, File API, Fetch API, and Storage API (`localStorage`).
* **Vendor Libraries:** `jsPDF` (v2.5.2) and `qrcode-generator` (v1.4.4) loaded via HTTPS CDN.

---

## Project Architecture

```plaintext
trailkit/
├── index.html                  # Landing hub, global search, and tool filtering
├── README.md                   # Project documentation
├── LICENSE                     # MIT license terms
├── assets/
│   ├── css/
│   │   ├── style.css           # Core design system and global token definitions
│   │   ├── responsive.css      # Viewport media queries and layout adaptations
│   │   └── animations.css      # Keyframes and transition interactions
│   ├── js/
│   │   ├── app.js              # Application entrypoint and search logic
│   │   ├── theme.js            # Theme switching and storage state
│   │   ├── navigation.js       # Mobile navigation and drawer handlers
│   │   ├── outdoor.js          # Geodesic and environmental calculation logic
│   │   ├── weather.js          # Open-Meteo integration and weather parsing
│   │   ├── image-tools.js      # Canvas processing and pixel manipulations
│   │   ├── pdf-tools.js        # Multi-page PDF assembly and jsPDF integration
│   │   ├── speech.js           # Speech-to-text handling and text downloads
│   │   └── utilities.js        # Developer formatters, converters, and crypto helpers
│   └── images/
│       └── logo.svg            # Vector branding assets
└── pages/
    ├── outdoor.html            # Outdoor navigation and calculations
    ├── weather.html            # Meteorological dashboard
    ├── image-tools.html        # Local image modification studio
    ├── pdf-tools.html          # Image aggregation and PDF compilation
    ├── speech.html             # Real-time microphone dictation interface
    ├── utilities.html          # Developer utilities collection
    └── about.html              # Reference attribution and platform details
```

---

## Getting Started

Because TrailKit uses no build system, bundling, or transpilation, you can run it immediately with any local static HTTP server.

### Local Setup

Clone the repository and serve the files:

```bash
# Clone repository
git clone https://github.com/your-username/trailkit.git
cd trailkit

# Option A: Python 3
python -m http.server 8000

# Option B: Node.js (via npx)
npx serve .

# Option C: PHP
php -S localhost:8000
```

Once running, navigate to `http://localhost:8000` in your browser.

---

## Deployment

Deploy TrailKit directly from your source repository without build commands:

### Netlify
* **Drag & Drop:** Upload the repository directory directly to [app.netlify.com/drop](https://app.netlify.com/drop).
* **Git Integration:** Connect your repository, set the **Publish directory** to root (`.`), and leave the **Build command** blank.

### Vercel
* Import your Git project into [vercel.com](https://vercel.com).
* Select **Other** as the framework preset.
* Keep the **Build Command** empty and designate the root (`.`) as the **Output Directory**.

### Cloudflare Pages
* Create a project in the **Pages** dashboard and connect your Git repository.
* Specify the build output directory as root (`.`) and leave the build command empty.

---

## External Dependencies & APIs

All dependencies are loaded via secure HTTPS CDNs and fall back gracefully with user-facing alerts if connectivity is lost.

### Third-Party Scripts

| Dependency | Version | Purpose | License | Source / CDN |
| :--- | :--- | :--- | :--- | :--- |
| **jsPDF** | `2.5.2` | Client-side vector and raster PDF creation | MIT | [cdnjs.cloudflare.com](https://cdnjs.cloudflare.com) |
| **qrcode-generator** | `1.4.4` | Offline QR code matrix generation | MIT | [jsdelivr.net](https://www.jsdelivr.com) |

### External APIs

| Provider | Consumed By | Authentication | Integration Scope |
| :--- | :--- | :--- | :--- |
| **Open-Meteo** | Weather Forecasting | None required | Geocoding lookups, current conditions, 7-day forecast models |
| **Frankfurter v2** | Currency Converter | None required | Reference exchange rates from the ECB and central banks (200+ currencies) |

> *Note:* No environment variables, proprietary API tokens, or hidden backend proxies are required to run this project.

---

## Browser Compatibility

| API / Feature | Chrome | Edge | Safari | Firefox | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Core Layout & UI** | 90+ | 90+ | 15+ | 90+ | CSS Grid, Flexbox, Custom Properties |
| **Web Crypto API** | Supported | Supported | Supported | Supported | Required for client-side hashing |
| **HTML5 Canvas & File API** | Supported | Supported | Supported | Supported | Used for offline image processing and PDF creation |
| **Async Clipboard API** | Supported | Supported | Supported | Supported | Requires secure origin (`https://` or `localhost`) |
| **Web Speech API** | Supported | Supported | Supported | **Not Supported** | Speech-to-text requires Chrome, Edge, or Safari |

---

## Privacy & Security

* **Local File Processing:** Images, documents, and generated PDFs remain inside your browser's execution thread; zero data is transmitted over the wire.
* **Audio Handling:** The Web Speech API delegates processing to native operating system or vendor runtimes (e.g., Google speech servers on Chrome); TrailKit stores or transmits no audio.
* **Local Persistence:** `localStorage` is used solely to store UI theme preferences and last-queried weather coordinates.
* **Input Validation:** User-provided files are constrained by MIME types and capped at a maximum size of 25 MB before reading.
* **Zero Tracking:** No tracking pixels, analytics scripts, profiling telemetry, or third-party cookies.
* **Execution Safety:** No dynamic string execution (`eval()`), code generation, or shell execution paths.

---

## Known Limitations

* **Hardware Sensors:** Web browsers lack arbitrary low-level access to device hardware such as barometer units and hardware magnetometers; altitude estimation requires manual pressure inputs, and compass functionality relies on the Device Orientation API where supported.
* **Speech Engine Support:** The Web Speech API is not supported in Mozilla Firefox. Full offline zero-install transcription without external vendors requires `whisper.cpp` WASM binaries and models (75 MB to 1.5 GB), which are omitted to keep the project lightweight.
* **Currency Rates:** Exchange rate data via the Frankfurter v2 API refreshes daily from the European Central Bank and central banking sources; real-time intraday trading ticks are not reflected.
* **PDF Memory Footprint:** Very large collections of high-resolution images can result in notable browser memory utilization during jsPDF canvas serialization.

---

## Attribution & Credits

TrailKit adapts open-source concepts, user-interface structures, and algorithm references from the following projects:

* **[Trail Sense](https://github.com/kylecorry31/Trail-Sense)** by Kyle Corry (MIT) — Navigational and environmental calculation patterns.
* **[AIC Weather Forecasting](https://github.com/fengyang95)** by fengyang95 (MIT) — Forecasting interface presentation.
* **[Images-to-PDF](https://github.com/Swati4star/Images-to-PDF)** by Swati4star — PDF generation and page sorting workflows.
* **[MultiMian ImageKit](https://github.com/Mianhassam96)** by Mianhassam96 — Image compression and manipulation tools.
* **[whisper.cpp](https://github.com/ggerganov/whisper.cpp)** by ggml-org (MIT) — Voice transcription baseline references.
* **[Bash-Snippets](https://github.com/alexanderepstein/Bash-Snippets)** by alexanderepstein (MIT) — Quick utility tool concepts.
* **[swap](https://github.com/florianv/swap)** by florianv (MIT) — Currency conversion logic inspiration.
* **[WinScript](https://github.com/flick9000)** by flick9000 — Utility UI design cues.
* **[Open-Meteo](https://open-meteo.com/)** — Free weather and geocoding API.
* **[Frankfurter](https://www.frankfurter.app/)** — Open exchange rate API.

All implementations in TrailKit are clean-room browser-native adaptations designed for vanilla JavaScript.

---

## Contributing

Contributions are welcome. Please review the following architectural standards before opening a pull request:

1. **Retain the Zero-Build Philosophy:** Do not add npm build systems, compilers, module bundlers, or server-side dependencies.
2. **Modular File Structure:** Keep tool implementations modularized in their designated scripts within `assets/js/`.
3. **No Unpinned Dependencies:** If adding external vendor libraries, prefer standard Web APIs first. Any required CDNs must use specific, pinned version tags.
4. **Preserve Integrity & Attribution:** Ensure any upstream algorithm references are credited with appropriate license compliance.

---

## License

This project is open source and available under the terms of the [MIT License](LICENSE). Original reference projects remain under their respective copyright and licensing agreements.
