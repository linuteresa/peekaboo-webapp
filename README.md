# Peekaboo Learn

An interactive educational game for children to learn letters, numbers, words, and speaking skills with AI tutor support.

## Features

- **Four Game Types:**
  - Letter Game: Learn alphabet recognition (25 pts each)
  - Number Game: Count and learn digits 1-10 (20 pts each)
  - Word Game: Fill-in-the-blank word puzzles (30 pts each)
  - Speak Game: Audio recording & pronunciation practice (40 pts each)

- **Adaptive Progression:**
  - 6-tier level system with unlockable content
  - Score-based progression with thresholds [0, 100, 250, 500, 800, 1200]
  - Level-up story rewards with narrative progression

- **AI Tutor:**
  - Gemma3 LLM via Ollama local inference
  - Context-aware help within game sessions
  - Customizable quick-action buttons

- **Learning Features:**
  - Video integration for multi-sensory learning
  - OCR support for text recognition
  - Sound effects & toggle setting
  - Proficiency tracking & smart content sorting

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6 modules), HTML5/CSS3
- **OCR:** Tesseract.js v5
- **AI:** Ollama (local) + Gemma3
- **Storage:** LocalStorage (automatic persistence)
- **Architecture:** State-driven rendering with screen-based navigation

## Setup

### Prerequisites
- Ollama installed with `gemma3` model (for AI tutor)
- Modern browser with ES6 support

## Browser Support

Requires modern JavaScript features (ES6, Fetch API, LocalStorage).
Tested on Chrome, Firefox, Safari, Edge.
