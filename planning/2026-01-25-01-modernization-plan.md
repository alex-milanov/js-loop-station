# js-loop-station: Modernization Plan

**Date:** 2026-01-25  
**Status:** Planning

## Overview

This document outlines the step-by-step modernization plan for `js-loop-station` to align with current best practices used in `jam-station` and `xAmplR`. The goal is to modernize the technology stack while preserving the unique 4-channel loop station functionality.

**See also:** `summaries/2026-01-25-01-project-comparison.md` for detailed comparison analysis.

**Scope:** This plan focuses on infrastructure and core library modernization. Functionality improvements and feature enhancements should be planned in separate sessions.

---

## Phase 1: Infrastructure (Critical)

**Goal:** Modernize build tools, package management, and CI/CD

### 1.1 Switch to pnpm

- [ ] Remove `package-lock.json`
- [ ] Install pnpm (if not already installed)
- [ ] Run `pnpm install` to generate `pnpm-lock.yaml`
- [ ] Update scripts/docs to reference pnpm
- [ ] Test that dependencies install correctly

**Benefits:**
- Faster installs
- Better disk space efficiency
- Consistent with jam-station and xAmplR

### 1.2 Migrate to Parcel 2

- [ ] Install Parcel 2 and required transformers:
  - `@parcel/config-default`
  - `@parcel/transformer-pug` (if using Pug)
  - `@parcel/transformer-sass`
- [ ] Remove Browserify and related dependencies:
  - `browserify`
  - `watchify`
  - `browserify-hmr`
- [ ] Update `package.json` scripts:
  - Replace build scripts with Parcel commands
  - Remove manual asset copying (Parcel handles this)
  - Remove manual SASS compilation
- [ ] Configure Parcel (if needed):
  - Create `parcelIgnore` in `package.json` (if needed)
  - Configure `staticFiles` for asset copying (if needed)
- [ ] Remove manual build scripts:
  - `bin/move-assets.js`
  - `bin/sass-paths.js` (if no longer needed)
- [ ] Update hot module reloading to use Parcel's built-in HMR
- [ ] Test build and dev server

**Migration Pattern:**
```json
// package.json
{
  "scripts": {
    "start": "parcel",
    "build": "parcel build --public-url /js-loop-station/"
  },
  "source": "src/index.html" // or index.pug
}
```

**Benefits:**
- Zero-config bundling
- Faster builds
- Better HMR
- Automatic code splitting
- Built-in asset handling

### 1.3 Add GitHub Actions CI/CD

- [ ] Create `.github/workflows/deploy.yml`
- [ ] Set up GitHub Pages deployment workflow:
  - Build on push to `master`
  - Use pnpm for dependency management
  - Build with Parcel
  - Deploy to GitHub Pages
- [ ] Configure repository settings:
  - Enable GitHub Pages
  - Set source to GitHub Actions
- [ ] Test workflow by pushing to master

**Workflow Template:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 9
        
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'pnpm'
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build
      run: pnpm run build
      
    - name: Setup Pages
      uses: actions/configure-pages@v4
      
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: './dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Benefits:**
- Automated deployments
- Consistent with other projects
- No manual deployment steps

---

## Phase 2: Data Flow & State Management (High Priority)

**Goal:** Migrate to modern RxJS and standardized state management

### 2.1 Migrate to Modern RxJS

- [ ] Remove `rx` 4.x dependency
- [ ] Install `rxjs` 7.x
- [ ] Update all Observable imports:
  ```javascript
  // Before
  const Rx = require('rx');
  const $ = Rx.Observable;
  
  // After
  const {Observable, fromEvent, interval, BehaviorSubject} = require('rxjs');
  const {map, filter, flatMap, distinctUntilChanged} = require('rxjs/operators');
  ```
- [ ] Convert all Observable chains to use `.pipe()`:
  ```javascript
  // Before (rx 4.x)
  $.fromEvent(...).flatMap(...).map(...).subscribe(...);
  
  // After (rxjs 7.x)
  fromEvent(...).pipe(
    mergeMap(...),  // or switchMap/concatMap
    map(...)
  ).subscribe(...);
  ```
- [ ] Replace `flatMap` with appropriate operator:
  - `flatMap` → `mergeMap` (default, concurrent)
  - Use `switchMap` for canceling previous (e.g., search)
  - Use `concatMap` for sequential (e.g., file uploads)
- [ ] Update service subscriptions to use modern RxJS
- [ ] Test all reactive functionality

**Files to Update:**
- `src/js/index.js`
- `src/js/services/audio.js`
- `src/js/services/midi.js`
- `src/js/services/visuals.js`
- `src/js/util/time.js`
- `src/js/util/recorder.js`
- `src/js/util/file.js`

### 2.2 Migrate to iblokz-state

- [ ] Install `iblokz-state`
- [ ] Replace custom `app.adapt()` with `createState()`:
  ```javascript
  // Before
  let actions = app.adapt(require('./actions'));
  actions = app.attach(actions, 'audio', audio.actions);
  const state$ = new Rx.BehaviorSubject();
  actions.stream.scan((state, change) => change(state), {})
    .subscribe(state => state$.onNext(state));
  
  // After
  const {createState, attach} = require('iblokz-state');
  let actionsTree = require('./actions');
  let {actions, state$} = createState(actionsTree);
  actions = attach(actions, 'audio', audio.actions);
  ```
- [ ] Replace custom `app.attach()` with `attach()` from iblokz-state
- [ ] Update action definitions to match iblokz-state pattern:
  - Actions should return state transformers (functions)
  - Ensure `initial` state is defined
- [ ] Remove `util/app.js` (no longer needed)
- [ ] Update service action attachments
- [ ] Test state management flow

**Files to Update:**
- `src/js/index.js`
- `src/js/actions/index.js`
- `src/js/services/audio.js`
- `src/js/services/midi.js`
- Remove: `src/js/util/app.js`

### 2.3 Update iblokz Libraries

- [ ] Update `iblokz-data` to 1.6.0
- [ ] Update `iblokz-snabbdom-helpers` to 2.0.0
- [ ] Test compatibility with updated libraries
- [ ] Update any deprecated API usage

**Note:** `iblokz-snabbdom-helpers@^2.0.0` requires RxJS v7, so this must happen after Phase 2.1.

### 2.4 Update Snabbdom (if direct dependency)

- [ ] Check if `snabbdom` is used directly or only via `iblokz-snabbdom-helpers`
- [ ] If direct dependency: Update to 3.6.3 (or remove if not needed)
- [ ] If only via helpers: Remove direct dependency (helpers handle it)

---

## Phase 3: Audio Library Integration (Medium Priority)

**Goal:** Migrate to iblokz-audio for standardized audio utilities

### 3.1 Evaluate Audio Utilities

- [ ] Review current `util/audio` implementation
- [ ] Compare with `iblokz-audio` capabilities
- [ ] Identify what functionality is provided by `iblokz-audio`:
  - Audio context management
  - Node creation (VCO, VCA, VCF, etc.)
  - Effects (LFO, Reverb, ADSR)
  - Connections and routing
- [ ] Identify any specialized functionality that needs to be preserved

### 3.2 Migrate to iblokz-audio

- [ ] Install `iblokz-audio`
- [ ] Replace custom audio utilities with `iblokz-audio`:
  ```javascript
  // Before
  const a = require('./util/audio');
  
  // After
  const a = require('iblokz-audio');
  ```
- [ ] Update all audio node creation:
  - Replace custom `create()` with `iblokz-audio` equivalents
  - Update VCO, VCA, VCF, LFO, Reverb, ADSR usage
- [ ] Update connection patterns:
  - Replace custom `connect()`/`disconnect()` with `iblokz-audio` patterns
- [ ] Preserve specialized functionality:
  - Keep any loop-station-specific audio logic
  - Adapt to `iblokz-audio` API where needed
- [ ] Remove custom audio utilities (if fully migrated):
  - `src/js/util/audio/` directory
- [ ] Test all audio functionality:
  - Recording
  - Playback
  - Effects
  - MIDI triggering

**Files to Update:**
- `src/js/index.js`
- `src/js/services/audio.js`
- `src/js/util/recorder.js` (may need updates)
- Remove: `src/js/util/audio/` (if fully migrated)

**Decision Point:**
- If `iblokz-audio` provides all needed functionality → full migration
- If custom audio utils have specialized features → keep but standardize API

---

## Migration Strategy

### Recommended Approach

1. **Complete Phase 1 first** - Infrastructure changes enable everything else
2. **Phase 2 must be sequential** - RxJS migration before iblokz-state, iblokz-state before snabbdom-helpers v2
3. **Test after each phase** - Ensure functionality works before proceeding
4. **Incremental commits** - Commit after each major change for easy rollback

### Risk Mitigation

- **Backup Current State**: Create a branch before starting
- **Incremental Testing**: Test after each phase
- **Feature Parity**: Ensure all existing features work after migration
- **Documentation**: Update README with new setup instructions

### Estimated Timeline

- **Phase 1**: 1-2 days (infrastructure)
- **Phase 2**: 2-3 days (data flow & state)
- **Phase 3**: 1-2 days (audio library)

**Total**: ~4-7 days for core modernization

---

## Benefits of Modernization

1. **Consistency**: Aligns with jam-station and xAmplR patterns
2. **Maintainability**: Easier to maintain with standardized patterns
3. **Performance**: Modern build tools and libraries improve performance
4. **Developer Experience**: Better tooling and faster development
5. **Future-Proof**: Uses current best practices and supported libraries
6. **Collaboration**: Easier for developers familiar with other projects

---

## Notes

- **Preserve Core Functionality**: The 4-channel loop station functionality is unique and must be preserved
- **Quantization Feature**: This is a key differentiator - ensure it works after migration
- **MIDI Mapping**: Current MIDI implementation works but could be enhanced (future planning)
- **Audio Context**: Ensure suspended state handling works correctly
- **Functionality Improvements**: Save/load, UI improvements, performance optimizations should be planned separately

---

## Next Steps

1. Review and approve this plan
2. Create feature branch: `modernize/phase-1-infrastructure`
3. Begin Phase 1 migration
4. Test thoroughly after each phase
5. Document any deviations or issues encountered
