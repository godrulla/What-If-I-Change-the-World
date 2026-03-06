# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**"What If I Change the World?"** — A bilingual (English/Spanish) inspirational book by Armando Diaz Silverio. This is a content repository, not a software project. It contains manuscripts, chapter drafts, illustrations, and publishing assets.

- **Genre:** Inspirational non-fiction, ages 12+
- **Tone:** Warm, conversational, Dominican energy, data-driven optimism
- **Structure:** 15 chapters across 4 parts (The Lens, The Compass, The Engine, The Temple)
- **Spanish title:** "Y Si Yo Cambio El Mundo?"

## Repository Structure

```
├── Book_Outline.md                    # Master 15-chapter outline with vision, themes, key points
├── notes/Book_Vision.md               # Quick reference: thesis, audience, influences, chapter list
├── KDP_Publishing_Review.md           # Amazon KDP compliance checklist (trim, margins, fonts, etc.)
├── BOOK_UPGRADE_AUDIT.md              # Story-by-story audit with rewrite directions
│
├── chapters/                          # English chapter drafts (01-14, markdown)
├── spanish_chapters/                  # Spanish chapter drafts (00 front matter through 16 back matter)
│
├── What_If_I_Change_the_World_FULL_MANUSCRIPT.*    # Complete English manuscript (md/docx/pdf)
├── Y_Si_Yo_Cambio_El_Mundo_MANUSCRITO_COMPLETO.*  # Complete Spanish manuscript (md/docx/pdf)
│
├── *_KIDS_EDITION.*                   # Kids edition variants
├── *_STORIES.*                        # Short stories collection (English)
├── *_CUENTOS.*                        # Short stories collection (Spanish)
├── *_BEAUTIFUL.*                      # Designed/formatted editions (PDF)
├── *_ILLUSTRATED_BOOK.*               # Illustrated editions with AI art
│
├── illustrations/                     # AI-generated illustrations (JPG, Nano Banana Pro Preview)
│   ├── GALLERY.html                   # Browser preview of all illustrations
│   └── 01-13 story folders/           # 4 images per story
├── illustrations_hybrid/              # Hybrid illustration set
├── illustrations_v2/                  # Updated illustrations
│
├── website/                           # Promotional website (index.html + images)
└── drafts/, research/                 # Working directories
```

## Key Editions

The book exists in multiple formats and editions:
1. **Full Manuscript** — Complete 15-chapter book (English + Spanish)
2. **Kids Edition** — Adapted for younger readers
3. **Stories/Cuentos** — Short story collection inspired by chapters (13 stories, bilingual)
4. **Illustrated Book** — Stories with AI-generated illustrations
5. **Beautiful Edition** — Designed HTML/PDF versions with embedded illustrations
6. **Storybook** — PowerPoint/PDF presentation format

## Working With This Repo

- **Markdown is the source of truth.** DOCX and PDF are generated exports. Edit `.md` files, then regenerate other formats.
- **Illustrations** were generated with Google AI Studio (Nano Banana Pro Preview) at ~$0.13/image. Style: children's book, warm vibrant colors, soft watercolor with bold outlines.
- **GALLERY.html** in `illustrations/` provides a visual browser preview of all art assets.
- The `website/` folder contains a standalone promotional site (`index.html`).

## Publishing Specs (KDP)

- Trim size: 6x9 inches
- Body font: Georgia/Times-Roman 11pt
- Inside/gutter margin: 0.75 in minimum
- ISBN placeholder still needs replacement before print submission

## Content Guidelines

- The book's core thesis: starts as the author's question ("What if I change the world?") and transfers to the reader by the final page
- Key influences: Hans Rosling's *Factfulness*, abundance/gratitude principles, Dominican culture, faith
- Stories in the children's editions should be hopeful and triumphant — never end on defeat or sadness (see BOOK_UPGRADE_AUDIT.md for specific rewrite directions)
- AI collaboration is openly credited — the book is written BY a human WITH AI
