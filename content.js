// ==UserScript==
// @name         ChatGPT Save as PDF Button
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ────────────────────────────────────────────────
  //  Config
  // ────────────────────────────────────────────────
  const BUTTON_ID = 'save-chatgpt-pdf-btn';
  const RETRY_INTERVAL = 1200;   // ms
  const MAX_ATTEMPTS = 25;

  // ────────────────────────────────────────────────
  //  Create floating button
  // ────────────────────────────────────────────────
  function createButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.innerText = '↓ Save as PDF';
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      padding: 12px 20px;
      font-size: 15px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #10a37f, #0e8c6a);
      border: none;
      border-radius: 50px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.28);
      cursor: pointer;
      transition: all 0.2s;
    `;

    btn.onmouseover = () => {
      btn.style.transform = 'scale(1.06)';
      btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.35)';
    };
    btn.onmouseout = () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.28)';
    };

    btn.onclick = generatePDF;
    document.body.appendChild(btn);
  }

  // ────────────────────────────────────────────────
  //  Core PDF generation logic
  // ────────────────────────────────────────────────
  async function generatePDF() {
    try {
      // Try modern selector first (2025+ layout)
      let messages = document.querySelectorAll([
        'div[data-message-author-role]',
        'article[data-testid^="conversation-turn-"]',
        'div[role="presentation"] > div[class*="markdown"]',
        '.agent-turn',
        '.user-turn',
        'div[class*="prose"]'
      ].join(', '));

      // Fallback - very generic (works when OpenAI changes classes often)
      if (messages.length < 4) {
        messages = document.querySelectorAll('div[class*="markdown"], div.prose, article, [data-message-author-role], .text-base');
      }

      if (messages.length < 3) {
        alert("Could not find enough messages.\n\nTry scrolling up completely first.");
        return;
      }

      // Prepare clean HTML content
      let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ChatGPT Conversation</title>
        <style>
          @page { margin: 1.8cm 1.6cm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.58;
            color: #111;
            max-width: 900px;
            margin: 0 auto;
            padding: 1rem 0;
          }
          .message {
            margin: 2.4rem 0;
            padding: 1.1rem 1.4rem;
            border-radius: 12px;
            position: relative;
          }
          .user {
            background: #e6f8ff;
            margin-left: 14%;
            border-top-right-radius: 0;
          }
          .assistant {
            background: #f4f4f7;
            margin-right: 14%;
            border-top-left-radius: 0;
          }
          .role {
            font-weight: 700;
            font-size: 0.95rem;
            margin-bottom: 0.6rem;
            color: #444;
          }
          pre {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
          }
          code { font-family: 'Consolas', 'Monaco', monospace; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <h1 style="text-align:center; margin-bottom:2.5rem;">ChatGPT Conversation</h1>
        <div style="font-size:0.9rem; text-align:center; color:#777; margin-bottom:3rem;">
          Saved on ${new Date().toLocaleString()}
        </div>
      `;

      messages.forEach((msg) => {
        const isUser = 
          msg.dataset?.messageAuthorRole === 'user' ||
          msg.className?.includes('user') ||
          msg.querySelector('[data-testid*="user"]') ||
          msg.textContent.trim().startsWith('You:');

        const role = isUser ? 'You' : 'ChatGPT';

        // Try to get the main content container
        let content = msg.querySelector('div[class*="prose"], div.markdown, .markdown') || msg;

        // Clone to avoid modifying original DOM
        const clone = content.cloneNode(true);
        // Clean up some noise
        clone.querySelectorAll('button, [aria-hidden="true"], svg').forEach(el => el.remove());

        htmlContent += `
          <div class="message ${isUser ? 'user' : 'assistant'}">
            <div class="role">${role}</div>
            ${clone.outerHTML}
          </div>
        `;
      });

      htmlContent += `
        </body>
      </html>`;

      // Open new window and print to PDF
      const win = window.open('', '_blank');
      if (!win) {
        alert("Popup blocked! Please allow popups for this site.");
        return;
      }

      win.document.write(htmlContent);
      win.document.close();

      // Give DOM time to render (especially important for code blocks & math)
      await new Promise(r => setTimeout(r, 1200));

      win.focus();
      win.print();   // user chooses "Save as PDF" in print dialog

    } catch (err) {
      console.error(err);
      alert("Error while creating PDF:\n" + err.message + "\n\nTry scrolling to top first.");
    }
  }

  // ────────────────────────────────────────────────
  //  Wait for ChatGPT UI to load
  // ────────────────────────────────────────────────
  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    const hasChatArea = document.querySelector('main, article, [data-testid^="conversation-turn-"]');

    if (hasChatArea || attempts > MAX_ATTEMPTS) {
      clearInterval(timer);
      if (hasChatArea) {
        createButton();
      }
    }
  }, RETRY_INTERVAL);

  // Re-check when URL changes (single page app)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(createButton, 1800);
    }
  }).observe(document, {subtree:true, childList:true});

})();