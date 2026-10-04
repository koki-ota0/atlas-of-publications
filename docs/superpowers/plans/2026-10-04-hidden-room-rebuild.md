# Hidden Room Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy hidden room with a three-bird key hunt that unlocks a mini-game-only room.

**Architecture:** Keep the site as one static `index.html`. Introduce a versioned bird-collection state and one small room controller; reuse only the existing attention mini-game renderer, deleting the legacy room tabs and story systems.

**Tech Stack:** Semantic HTML, CSS, vanilla JavaScript, Python Playwright.

**Spec:** `docs/superpowers/specs/2026-10-04-hidden-room-rebuild.md`

## Global Constraints

- The door stays fixed at the current bottom-right position.
- The door is not rendered as visible until all three unique birds are collected.
- The rebuilt room contains only the attention mini-game.
- Existing profile, ATLAS, map, timeline, and INDEX behavior must continue working.

## Review Focus

- Repeated tapping of one bird must not unlock the door; the Playwright test collects the same bird twice before the others.
- Reloading must preserve collected birds under the new versioned key; the test reloads after partial collection.
- Legacy LocalStorage keys must not unlock the new room; the test seeds the old key before loading.
- Keyboard users must be able to collect birds and open/close the room; the test uses Enter and Escape.
- Mobile users must have usable tap targets without making birds visually obvious; the test checks minimum hit-area dimensions.

---

### Task 1: Lock the New Interaction Contract

**Files:**
- Create: `/tmp/test_hidden_room_rebuild.py`
- Test: `/tmp/test_hidden_room_rebuild.py`

**Interfaces:**
- Consumes: the current static site at `index.html`
- Produces: assertions for `.secret-bird[data-bird]`, `atlas-birds-v2`, `#doordock`, and `#room`

- [ ] **Step 1: Write the failing Playwright test**
- [ ] **Step 2: Run it and verify failure because three birds and the new room contract do not exist**

### Task 2: Replace Legacy Unlock State with Three Birds

**Files:**
- Modify: `index.html`
- Test: `/tmp/test_hidden_room_rebuild.py`

**Interfaces:**
- Consumes: unique bird ids `banner`, `map`, `index`
- Produces: `collectBird(id)`, `syncBirdHunt()`, LocalStorage key `atlas-birds-v2`

- [ ] **Step 1: Add three semantic bird buttons and responsive 32px minimum hit areas**
- [ ] **Step 2: Implement unique collection, persistence, and door visibility**
- [ ] **Step 3: Run the focused test and verify the unlock flow passes**

### Task 3: Rebuild the Room Around the Mini-game

**Files:**
- Modify: `index.html`
- Test: `/tmp/test_hidden_room_rebuild.py`

**Interfaces:**
- Consumes: `openRoom()`, `closeRoom()`, existing game functions
- Produces: a single-panel `#room` with `#rbody` and close control

- [ ] **Step 1: Delete cat, fragments, achievements, experiments, shelf, terminal, and room tabs**
- [ ] **Step 2: Render only the attention mini-game in the room**
- [ ] **Step 3: Verify opening, playing, closing, and absence of legacy UI**

### Task 4: Regression and Publication

**Files:**
- Modify: `index.html`
- Test: existing `/tmp/test_atlas_*.py` scripts where applicable

**Interfaces:**
- Consumes: rebuilt hidden room
- Produces: published GitHub Pages update

- [ ] **Step 1: Run syntax, Playwright, desktop, and mobile checks**
- [ ] **Step 2: Commit and push the verified implementation**
- [ ] **Step 3: Confirm the GitHub Pages build and public HTML**
