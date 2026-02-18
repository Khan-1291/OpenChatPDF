# OpenChatPDF

**Save your ChatGPT conversations as clean, readable PDFs – 100% locally, no account needed, completely free & open-source.**

A lightweight Chrome extension that adds a floating "Save as PDF" button to [chatgpt.com](https://chatgpt.com) and [chat.openai.com](https://chat.openai.com), letting you export entire conversations (including code blocks, math, images) with good formatting — without screenshots or paid tools.

<p align="center">
  <img src="/screen.png" alt="Screenshot of OpenChatPDF button on ChatGPT" width="720">
  <br><small>(Replace this placeholder with a real screenshot after upload)</small>
</p>

## ✨ Features

- One-click export of the current conversation
- Preserves code blocks, markdown formatting, images
- Clean two-column layout (You ↔ ChatGPT)
- Works completely offline — **nothing is sent to any server**
- No login, no tracking, no ads
- Open source under MIT license

## 🚀 Installation

### Option 1: Chrome Web Store (recommended – coming soon)

(Once published – link will be here)

### Option 2: Install from GitHub (developer mode – works immediately)

1. Go to → [Releases page](https://github.com/Khan-1291/OpenChatPDF/releases)
2. Download the latest `.zip` file (or `.crx` if available)
3. Unzip it to a folder on your computer (e.g. `C:\Extensions\OpenChatPDF`)
4. Open Chrome and go to: `chrome://extensions/`
5. Turn on **Developer mode** (top right switch)
6. Click **Load unpacked** → select the folder you just unzipped
7. Done! The green floating button should appear on chatgpt.com

<p align="center">
  <img src="/screen2.png" width="600">
</p>

## 📸 Screenshots

(Add 3–5 screenshots here later)

1. Floating button appears bottom-right  
2. Print dialog → choose "Save as PDF"  
3. Example exported PDF layout  
4. Code block & math rendering example  
5. Dark mode support (if you add it later)

## 🛠 How to Build / Modify

1. Clone the repo  
   ```bash
   git clone https://github.com/Khan-1291/OpenChatPDF.git
   cd openchatpdf