# Miro

## Overview

> **Note:** It is recommended that you fork the repository. Sometimes we keep it private.

This extension makes it easier to watch videos on N Prep! When a video ends, it automatically moves to the next video. You can enable or disable this extension from the right-click menu or use the on-page controls.

## Features

- **Automatic Video Playback**: Seamlessly advances through educational video content
- **Context Menu Integration**: Right-click access to all extension features
- **AI Integration**: Direct access to ChatGPT, Claude, Perplexity, Genspark, and Felo for exercise help
- **Exercise Content Extraction**: Copy and format exercise content as Markdown
- **Smart Notifications**: Alerts for evaluation tests, essays, and reports
- **Flexible UI Controls**: On-page buttons with customizable positioning
- **Background Playback**: Continue video progression even when tab is not active
- **Return to Chapter**: Automatically navigate back to chapter overview after completion

## Technology Stack

- React 19 + TypeScript
- Vite for fast development and builds
- Chrome Extension Manifest V3
- Modern web extension APIs

## Notice

This extension implements useful features that did not exist in the original extension.
Please do not contact previous developers with inquiries about this extension, as they are not involved.

In no event shall the author or copyright holder be liable for any claim, damages or other obligation, whether in contract, tort or otherwise, arising out of or in connection with the Software or the use or other processing of the Software.

> **Disclaimer:** This extension is intended for study assistance only. The developer is not responsible for any abuse by users.

## Acknowledgments

This project builds upon the excellent work of the original Classroom extension developers. We deeply appreciate their contributions to educational technology and their dedication to helping students succeed. Special thanks to the original developers who created the foundation that made this enhanced version possible.

## Supported Browsers

> **Note:** For iOS devices, please use the Orion browser

- Chrome
- Edge  
- Firefox
- Orion (Install from Chrome Web Store)

## To School Officials

This application does not interfere in any way with educational platform servers.

All data analysis is performed from the currently displayed web page content. The extension simply automates navigation between videos and provides study assistance tools. No server data is modified or accessed inappropriately.

The extension operates entirely within the browser's security sandbox and follows all web extension security best practices.

## Installation & Usage

### Prerequisites

* Node.js 20 or higher
* pnpm package manager

### Build Instructions

Install the required packages:
```bash
pnpm install
```

Build the extension:
```bash
pnpm build
```

### Chrome Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder from where you cloned this repository
6. Go to [https://www.nnn.ed.nico/](https://www.nnn.ed.nico/) and enjoy!

### Edge Installation

1. Clone this repository
2. Open Edge and go to `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder from where you cloned this repository
6. Go to [https://www.nnn.ed.nico/](https://www.nnn.ed.nico/) and enjoy!

### Firefox Installation

1. Clone this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click "Load temporary add-on"
4. Select the manifest.json file in the `dist` folder
5. Go to `about:addons` and open the extension management
6. Enable access to `https://www.nnn.ed.nico/*`
7. Go to [https://www.nnn.ed.nico/](https://www.nnn.ed.nico/) and enjoy!

## How to Use

### Basic Operation
1. Navigate to supported educational sites
2. The extension automatically detects video content and adds controls
3. Videos will auto-advance when completed (if enabled)

### Right-Click Menu Options
- **Toggle Extension**: Enable/disable the extension
- **Copy Exercise**: Extract exercise content to clipboard as Markdown
- **Ask AI**: Open AI services with formatted exercise questions
  - ChatGPT, Claude, Perplexity, Genspark, Felo supported
- **Settings**: Configure extension behavior
- **Repository**: View source code and documentation

### On-Page Controls
- **Extension Toggle**: Enable/disable functionality
- **Auto-Play Controls**: Manage video progression
- **Background Play**: Continue when tab is inactive
- **Settings Button**: Quick access to options page

### Settings Configuration
Access via extension icon or right-click menu:
- **Video Playback Settings**: Control auto-play behavior
- **UI Customization**: Button positioning and minimal mode
- **Advanced Options**: Background play, return behavior

## Development

### Development Setup

1. Clone and install dependencies:
```bash
git clone https://github.com/operationcheck/miro.git
cd miro
pnpm install
```

2. Start development server:
```bash
pnpm dev
```

3. Build for production:
```bash
pnpm build
```

### Code Quality

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Code formatting
pnpm format
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
