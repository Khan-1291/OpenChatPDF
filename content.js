// OpenChatPDF v2.0 – Multi-LLM conversation to PDF exporter
// Supports: ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Microsoft Copilot
// 100% local – nothing leaves your browser

(function () {
  'use strict';

  // ────────────────────────────────────────────────
  //  Config
  // ────────────────────────────────────────────────
  const BUTTON_ID = 'openchatpdf-btn';
  const RETRY_INTERVAL = 1000;
  const MAX_ATTEMPTS = 30;

  // Site-specific configuration
  const SITES = {
    chatgpt: {
      name: 'ChatGPT',
      match: (host) => host.includes('chatgpt.com') || host.includes('chat.openai.com'),
      messageSelectors: [
        'div[data-message-author-role]',
        'article[data-testid^="conversation-turn-"]',
        'div[data-message-id]'
      ],
      isUser: (el) => {
        const role = el.getAttribute('data-message-author-role') ||
                     el.querySelector('[data-message-author-role]')?.getAttribute('data-message-author-role');
        return role === 'user' ||
               el.classList.contains('user') ||
               !!el.querySelector('[data-testid*="user"]');
      },
      getContent: (el) => el.querySelector('div[class*="markdown"], div.prose, .markdown, [class*="message-content"]') || el,
      userLabel: 'You',
      assistantLabel: 'ChatGPT'
    },

    claude: {
      name: 'Claude',
      match: (host) => host.includes('claude.ai'),
      messageSelectors: [
        '[data-test-render-count]',
        'div[class*="font-claude-message"]',
        'div[class*="Message"]',
        'div.group'
      ],
      isUser: (el) => {
        // Claude: user messages often have specific structure
        return !!el.querySelector('[data-testid="user-message"]') ||
               el.getAttribute('data-is-author') === 'true' ||
               (el.className || '').toLowerCase().includes('user') ||
               !!el.closest('[data-testid="user-message"]');
      },
      getContent: (el) => el.querySelector('[class*="prose"], [class*="markdown"], .font-claude-message, div[class*="grid"]') || el,
      userLabel: 'You',
      assistantLabel: 'Claude'
    },

    gemini: {
      name: 'Gemini',
      match: (host) => host.includes('gemini.google.com'),
      messageSelectors: [
        'message-content',
        'div[class*="conversation-container"] > div',
        'div.model-response-text',
        'div.query-text',
        'div[data-message-id]'
      ],
      isUser: (el) => {
        return !!el.querySelector('.query-text, [class*="user-query"]') ||
               el.classList.contains('user-query') ||
               (el.getAttribute('data-message-author-role') === 'user') ||
               !!el.closest('[class*="user"]');
      },
      getContent: (el) => el.querySelector('message-content, .markdown, [class*="response-container"], .model-response-text, .query-text') || el,
      userLabel: 'You',
      assistantLabel: 'Gemini'
    },

    grok: {
      name: 'Grok',
      match: (host) => host.includes('grok.x.ai') || (host.includes('x.com') && location.pathname.includes('/i/grok')),
      messageSelectors: [
        'div[class*="message"]',
        'div[data-testid="message"]',
        'div[class*="conversation"] > div',
        'article'
      ],
      isUser: (el) => {
        return !!el.querySelector('[data-testid="user-message"]') ||
               (el.className || '').toLowerCase().includes('user') ||
               el.getAttribute('data-author') === 'user' ||
               !!el.querySelector('div[class*="user"]');
      },
      getContent: (el) => el.querySelector('[class*="markdown"], [class*="prose"], div[dir="auto"]') || el,
      userLabel: 'You',
      assistantLabel: 'Grok'
    },

    deepseek: {
      name: 'DeepSeek',
      match: (host) => host.includes('chat.deepseek.com'),
      messageSelectors: [
        'div[class*="message"]',
        'div[class*="ds-message"]',
        'div[data-message-id]',
        '.chat-message'
      ],
      isUser: (el) => {
        return (el.className || '').toLowerCase().includes('user') ||
               el.getAttribute('data-role') === 'user' ||
               !!el.querySelector('[class*="user"]');
      },
      getContent: (el) => el.querySelector('.markdown, [class*="md"], [class*="content"], pre') || el,
      userLabel: 'You',
      assistantLabel: 'DeepSeek'
    },

    perplexity: {
      name: 'Perplexity',
      match: (host) => host.includes('perplexity.ai'),
      messageSelectors: [
        'div[class*="Message"]',
        'div[class*="query"]',
        'div[class*="answer"]',
        'div.prose'
      ],
      isUser: (el) => {
        return !!el.querySelector('[class*="query"]') ||
               (el.className || '').toLowerCase().includes('user') ||
               (el.className || '').toLowerCase().includes('query');
      },
      getContent: (el) => el.querySelector('.prose, [class*="markdown"], [class*="answer"]') || el,
      userLabel: 'You',
      assistantLabel: 'Perplexity'
    },

    copilot: {
      name: 'Copilot',
      match: (host) => host.includes('copilot.microsoft.com'),
      messageSelectors: [
        'div[data-content="ai-message"]',
        'div[data-content="user-message"]',
        'div[class*="message"]',
        'div.group'
      ],
      isUser: (el) => {
        return el.getAttribute('data-content') === 'user-message' ||
               (el.className || '').toLowerCase().includes('user');
      },
      getContent: (el) => el.querySelector('[class*="markdown"], [class*="prose"], div[dir="auto"]') || el,
      userLabel: 'You',
      assistantLabel: 'Copilot'
    }
  };

  // ────────────────────────────────────────────────
  //  Detect current site
  // ────────────────────────────────────────────────
  function detectSite() {
    const host = location.hostname;
    for (const key of Object.keys(SITES)) {
      if (SITES[key].match(host)) {
        return SITES[key];
      }
    }
    return null;
  }

  // ────────────────────────────────────────────────
  //  Create floating button
  // ────────────────────────────────────────────────
  function createButton(site) {
    if (document.getElementById(BUTTON_ID)) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.innerHTML = `↓ Save as PDF`;
    btn.title = `Export this ${site.name} conversation as PDF`;
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: white;
      background: linear-gradient(135deg, #10a37f, #0d8a6a);
      border: none;
      border-radius: 50px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      user-select: none;
    `;

    btn.onmouseover = () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = '0 6px 22px rgba(0,0,0,0.38)';
    };
    btn.onmouseout = () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
    };

    btn.onclick = () => generatePDF(site);
    document.body.appendChild(btn);
  }

  // ────────────────────────────────────────────────
  //  Core PDF generation
  // ────────────────────────────────────────────────
  async function generatePDF(site) {
    try {
      let messages = [];

      // Try each selector
      for (const sel of site.messageSelectors) {
        const found = document.querySelectorAll(sel);
        if (found.length >= 2) {
          messages = Array.from(found);
          break;
        }
      }

      // Fallback: more aggressive search
      if (messages.length < 2) {
        messages = Array.from(document.querySelectorAll(
          'div[class*="message"], div[class*="Message"], article, [data-message-author-role], [data-testid*="message"], .prose, [class*="markdown"]'
        ));
      }

      if (messages.length < 2) {
        alert(
          `Could not find enough messages on ${site.name}.\n\n` +
          `Tips:\n• Scroll to the top of the conversation first\n• Make sure the page has fully loaded\n• Try refreshing the page`
        );
        return;
      }

      // Deduplicate nested elements (keep only top-level messages)
      messages = messages.filter((el, idx, arr) => {
        return !arr.some((other, i) => i !== idx && other.contains(el));
      });

      const htmlContent = buildHTML(messages, site);

      const win = window.open('', '_blank');
      if (!win) {
        alert('Popup blocked! Please allow popups for this site and try again.');
        return;
      }

      win.document.write(htmlContent);
      win.document.close();

      // Wait for images / code highlighting to settle
      await new Promise(r => setTimeout(r, 900));

      win.focus();
      win.print();
    } catch (err) {
      console.error('[OpenChatPDF]', err);
      alert(`Error while creating PDF:\n${err.message}\n\nTry scrolling to the top and trying again.`);
    }
  }

  // ────────────────────────────────────────────────
  //  Build clean printable HTML
  // ────────────────────────────────────────────────
  function buildHTML(messages, site) {
    const now = new Date().toLocaleString();

    let body = '';
    messages.forEach((msg) => {
      const isUser = site.isUser(msg);
      const role = isUser ? site.userLabel : site.assistantLabel;

      let contentEl = site.getContent(msg);
      const clone = contentEl.cloneNode(true);

      // Remove interactive / noisy elements
      clone.querySelectorAll(
        'button, [aria-hidden="true"], svg, [role="button"], ' +
        'input, textarea, [class*="copy"], [class*=" Cop"], [class*="feedback"], ' +
        '[class*="toolbar"], [class*="action"], [data-testid*="copy"]'
      ).forEach(el => el.remove());

      // Convert relative image srcs if needed (keep as-is for now)
      body += `
        <div class="message ${isUser ? 'user' : 'assistant'}">
          <div class="role">${role}</div>
          <div class="content">${clone.innerHTML}</div>
        </div>
      `;
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${site.name} Conversation – OpenChatPDF</title>
  <style>
    @page { margin: 1.6cm 1.5cm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 860px;
      margin: 0 auto;
      padding: 1.2rem 0.5rem 3rem;
      background: #fff;
    }
    h1 {
      text-align: center;
      font-size: 1.55rem;
      font-weight: 700;
      margin: 0 0 0.4rem;
      color: #111;
    }
    .meta {
      text-align: center;
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 2.2rem;
    }
    .message {
      margin: 1.6rem 0;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      page-break-inside: avoid;
    }
    .user {
      background: #e8f4fd;
      margin-left: 12%;
      border-top-right-radius: 4px;
    }
    .assistant {
      background: #f3f4f6;
      margin-right: 12%;
      border-top-left-radius: 4px;
    }
    .role {
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 0.45rem;
      color: #374151;
      letter-spacing: 0.01em;
    }
    .content {
      font-size: 0.95rem;
    }
    .content p { margin: 0.55rem 0; }
    .content pre, pre {
      background: #1e1e1e !important;
      color: #d4d4d4 !important;
      padding: 1rem 1.1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.84rem;
      line-height: 1.45;
      margin: 0.8rem 0;
    }
    .content code, code {
      font-family: "SF Mono", "Cascadia Code", "Consolas", "Monaco", monospace;
      font-size: 0.88em;
    }
    .content :not(pre) > code {
      background: #f0f0f0;
      padding: 0.15em 0.35em;
      border-radius: 4px;
    }
    .content img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 0.6rem 0;
    }
    .content table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.8rem 0;
    }
    .content th, .content td {
      border: 1px solid #d1d5db;
      padding: 0.45rem 0.7rem;
      text-align: left;
    }
    .content th { background: #f3f4f6; }
    .content ul, .content ol { padding-left: 1.4rem; margin: 0.5rem 0; }
    .content blockquote {
      border-left: 4px solid #d1d5db;
      margin: 0.7rem 0;
      padding: 0.3rem 0 0.3rem 1rem;
      color: #4b5563;
    }
    .footer {
      text-align: center;
      font-size: 0.78rem;
      color: #9ca3af;
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <h1>${site.name} Conversation</h1>
  <div class="meta">Exported with OpenChatPDF • ${now}</div>
  ${body}
  <div class="footer">Generated locally by OpenChatPDF • Nothing was sent to any server</div>
</body>
</html>`;
  }

  // ────────────────────────────────────────────────
  //  Initialization
  // ────────────────────────────────────────────────
  function init() {
    const site = detectSite();
    if (!site) return;

    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      // Simple presence check – any main content area
      const ready = document.querySelector('main, [role="main"], article, #__next, body > div');
      if (ready || attempts >= MAX_ATTEMPTS) {
        clearInterval(timer);
        createButton(site);
      }
    }, RETRY_INTERVAL);

    // SPA navigation support
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Remove old button so a new one can be created if needed
        const old = document.getElementById(BUTTON_ID);
        if (old) old.remove();
        setTimeout(() => createButton(site), 1200);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
