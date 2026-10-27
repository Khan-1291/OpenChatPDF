# Contributing to OpenChatPDF

Thank you for your interest in improving OpenChatPDF!  
This project stays useful only because people like you help keep the selectors up-to-date and add new features.

## Ways to Contribute

1. **Report bugs** – Open an issue with:
   - Which AI site (ChatGPT, Claude, Gemini, Grok, DeepSeek, etc.)
   - Browser + version
   - What happened vs what you expected
   - Screenshots if possible

2. **Suggest features** – New sites, better PDF styling, keyboard shortcut, dark PDF theme, etc.

3. **Submit code** – Especially welcome:
   - New site support
   - More robust message extraction (sites change their DOM frequently)
   - PDF layout / CSS improvements
   - Accessibility improvements
   - Documentation & screenshots

## Development Setup

```bash
git clone https://github.com/Khan-1291/OpenChatPDF.git
cd OpenChatPDF
```

No build tools or package managers are required.  
Load the folder as an **unpacked extension** in Chrome (`chrome://extensions/` → Developer mode → Load unpacked).

After changing `content.js` or `manifest.json`, click the refresh icon on the extension card and reload the chat page.

## Adding Support for a New AI Chat Site

1. Open `content.js`
2. Add a new entry inside the `SITES` object. Example skeleton:

```js
newsitename: {
  name: 'Nice Name',
  match: (host) => host.includes('example.com'),
  messageSelectors: [
    'selector1',
    'selector2'
  ],
  isUser: (el) => {
    // return true if this element is a user message
    return el.getAttribute('data-role') === 'user';
  },
  getContent: (el) => el.querySelector('.markdown') || el,
  userLabel: 'You',
  assistantLabel: 'Bot Name'
}
```

3. Also add the domain to `host_permissions` and `content_scripts.matches` in `manifest.json`.
4. Test thoroughly on real conversations (short + long, with code blocks, images, tables).
5. Open a Pull Request describing the site and how you tested it.

## Code Style

- Keep it simple – vanilla JS, no frameworks
- Prefer clear variable names over clever one-liners
- Add short comments only when the “why” is not obvious
- Match the existing formatting (2-space indent, single quotes preferred)

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/add-xxx-support`)
3. Make your changes and test them
4. Commit with a clear message (`git commit -m "Add support for XXX"`)
5. Push and open a Pull Request against `main`
6. Fill in the PR template (if present) or clearly describe:
   - What the PR does
   - Which sites / browsers you tested on
   - Screenshots if UI-related

Small, focused PRs are much easier to review and merge quickly.

## Code of Conduct

Be respectful and constructive. Harassment or toxic behavior will not be tolerated.  
The goal is a welcoming project for everyone who wants better local tools for AI chats.

## Questions?

Open an issue with the `question` label or start a discussion.  
Happy contributing! 🚀
