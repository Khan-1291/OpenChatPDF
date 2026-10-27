# Changelog

All notable changes to OpenChatPDF will be documented in this file.

## [2.0.0] – 2026-10-27

### Added
- **Multi-LLM support**: ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Microsoft Copilot
- Site-specific message extraction logic for more reliable exports
- Improved PDF layout (better code blocks, tables, images, spacing)
- Clear documentation: README, CONTRIBUTING.md, CODE_OF_CONDUCT.md
- Suggested GitHub topics for better discoverability

### Changed
- Rewrote `content.js` with modular site configuration
- Updated `manifest.json` to version 2.0.0 and expanded host permissions
- Better error messages and SPA navigation handling

### Fixed
- More robust fallback selectors when sites change their DOM

## [1.1] – Previous

- Initial public release focused on ChatGPT only
