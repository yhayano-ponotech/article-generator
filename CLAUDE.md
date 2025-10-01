# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **article-generator** application that uses **Gemini 2.5 Flash** (`gemini-2.5-flash-preview-09-2025`) to generate Japanese articles in Markdown format with a live preview editor. The app is a **frontend-only Next.js application** with no custom backend—all API calls, storage, and exports happen in the browser.

**Tech Stack:**
- **Next.js 15** (App Router) with **TypeScript** (strict mode)
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (Radix Primitives-based, accessible)
- **@google/genai** SDK for client-side Gemini API calls
- **IndexedDB** for local storage (drafts, sessions, export history)
- Client-side PDF generation and Markdown export

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm build

# Start production server
npm start

# Run linter
npm run lint
```

The dev server runs on `http://localhost:3000` by default.

## Architecture

### Frontend-Only Design
- **No backend**: All API calls to Gemini are made directly from the client using `@google/genai`
- **Data persistence**: IndexedDB/LocalStorage for auto-save, drafts, sessions, and exports
- **Streaming**: Gemini streaming responses are handled via ReadableStream in the browser
- **Export**: PDF generation and .md downloads happen entirely client-side

### Key Directories
- `src/app/` - Next.js App Router pages and layouts
- Path alias: `@/*` maps to `./src/*` (see tsconfig.json:21)

### Core Features
1. **Meta Suggestion**: AI suggests 6 metadata fields (title, audience, purpose, tone, length, special instructions)
2. **Streaming Generation**: Article content streams into editor in real-time
3. **Live Preview**: Markdown rendered with support for SVG, Mermaid diagrams, and LaTeX math
4. **Sync Scroll**: Editor and preview panes scroll together based on AST node mapping
5. **Export**: PDF (client-side rendering) and .md download
6. **Validation/Lint**: Checks for note.com heading conventions, LaTeX table format, punctuation rules

## Important Design Constraints

### Style Policy (from docs/design.md)
Generated articles must follow **note.com** conventions:
- Title: `#` (single hash)
- Major headings: `##` (double hash)
- Minor headings: `###` (triple hash)
- Sub-minor headings: Use bold text with `(1)`, `(2)` numbering instead of deeper heading levels
- Tables: Use LaTeX `array` format (see docs/design.md:238-250 for full example)
- Diagrams: Frequent use of SVG/Mermaid
- Punctuation: Sentences must end with 句点 (。)

### Security (Frontend-Only Considerations)
- **API Key**: Gemini API key stored in browser; **must use HTTP referrer restriction** in Google AI Studio
- **XSS**: Strict sanitization for Markdown→HTML, SVG, Mermaid (`securityLevel: strict`), and KaTeX
- **CSRF**: Not applicable unless user auth is added later

### Data Model
Key entities stored in IndexedDB:
- **DRAFT**: `{ id, title, markdown, meta, style, updated_at }`
- **SESSION**: `{ id, draft_id, status, prompt, tokens, started_at, ended_at }`
- **REFERENCE**: `{ id, draft_id, label, url, note }`
- **EXPORT**: `{ id, draft_id, type, url, status, created_at }`

## Prompt Strategy

**Meta Suggestion Prompt**: Given user input (theme/keywords), return JSON with 6 fields in Japanese.

**Article Generation Prompt** (see docs/design.md:206-251): A detailed system prompt defining:
- Article structure (heading, intro, body with headings, conclusion)
- Quality elements (unique perspective, examples, conversational tone, citations, diagrams, minimal bullet points)
- Editorial guidelines (fact-checking, consistency, readability, sentence-ending punctuation)
- note.com heading format
- LaTeX table format with escaped underscores

## UI Components (shadcn/ui)

Use these components consistently:
- **MetaForm**: Dialog for 6-field metadata editing
- **StreamPane**: Toast/Progress/Badge for streaming status
- **MarkdownEditor**: Textarea-like editor with outline, diff view, shortcuts
- **PreviewRenderer**: Tabs/ScrollArea with SVG/Mermaid/KaTeX rendering, theme switching, sync scroll
- **ExportPanel**: Dialog/Select for PDF/MD export settings
- **History/Versioning**: Drawer/List for restoring past versions

**Layout**: Split-pane (editor | preview) with resizable divider; switches to Tabs on narrow screens.

## Performance & Rendering

- **Sync Scroll Algorithm**: AST parsing maps Markdown source offsets to DOM nodes; scroll events interpolate between nodes
- **Mermaid/KaTeX**: Lazy initialization, re-render on theme change, sanitize with DOMPurify
- **Virtual Scrolling**: For long documents
- **Diff Rendering**: Only update changed portions of preview

## Acceptance Criteria (docs/design.md:352-363)

- Meta suggestion appears within 5 seconds
- First token of article appears within 1 second, sustaining 10+ tokens/sec
- Preview does not break with Mermaid/LaTeX/SVG content
- Sync scroll works at heading granularity
- One-click .md download and client-side PDF generation (50+ pages supported)
- Auto-save to IndexedDB, restores after reload
- XSS sanitization active, API key referrer restriction documented
- TypeScript strict mode builds successfully
- shadcn/ui components are keyboard-navigable

## Future Extensions (docs/design.md:383-388)

- Auto-formatting of references (footnotes, APA, ISO690)
- Web search/RAG for citation insertion
- Version control/collaborative editing (CRDT)
- Template gallery and prompt recipe sharing
