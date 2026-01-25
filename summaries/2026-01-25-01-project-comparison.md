# js-loop-station: Project Comparison Summary

**Date:** 2026-01-25  
**Status:** Analysis Complete

## Executive Summary

This document compares `js-loop-station` with `jam-station` and `xAmplR` to identify architectural patterns, technology choices, and key differences. The analysis reveals that `js-loop-station` uses legacy tooling and custom patterns, while the other projects have modernized to use standardized libraries and build tools.

---

## Technology Stack Comparison

| Aspect | js-loop-station | jam-station | xAmplR |
|--------|----------------|-------------|---------|
| **Build Tool** | Browserify | Parcel 2 | Parcel 2 |
| **State Management** | Custom RxJS (rx 4.x) | iblokz-state | iblokz-state |
| **RxJS Version** | rx 4.1.0 (legacy) | rxjs 7.8.1 | rxjs 7.8.0 |
| **Virtual DOM** | Snabbdom 0.5.4 | iblokz-snabbdom-helpers 2.0.0 | iblokz-snabbdom-helpers 2.0.0 |
| **Audio Library** | Custom util/audio | iblokz-audio 0.1.0 | Custom util/audio (planned migration) |
| **Package Manager** | npm | pnpm | pnpm |
| **Testing** | None | Playwright E2E | Playwright E2E |
| **Hot Reload** | browserify-hmr | Parcel HMR | Parcel HMR |
| **License** | ISC | AGPL-3.0 | AGPL-3.0 |

---

## Architecture Comparison

### js-loop-station (Current)

```
Actions (custom adapt) → RxJS Subject → State (BehaviorSubject) → UI
Services: audio, midi, visuals (hook-based)
```

**Characteristics:**
- Custom action adaptation system (`util/app.js`)
- Manual RxJS stream management
- Service hooks with manual subscription management
- No standardized state management library

**State Management Pattern:**
```javascript
// Custom adaptation
let actions = app.adapt(require('./actions'));
actions = app.attach(actions, 'audio', audio.actions);
const state$ = new Rx.BehaviorSubject();
actions.stream.scan((state, change) => change(state), {})
  .subscribe(state => state$.onNext(state));
```

**Service Pattern:**
```javascript
// Manual hook management
const hook = ({state$, actions}) => {
  let subs = [];
  // ... subscriptions
  unhook = () => subs.forEach(sub => sub.dispose());
};
```

### jam-station & xAmplR (Modern)

```
Actions → iblokz-state (createState) → State$ (Observable) → UI
Services: Self-contained with actions + hooks
```

**Characteristics:**
- Standardized `iblokz-state` for state management
- Service actions attached via `attach()` helper
- Consistent service pattern: `{actions, hook, unhook}`
- Modern RxJS v7 with pipe operators

**State Management Pattern:**
```javascript
// Standardized iblokz-state
const {createState, attach} = require('iblokz-state');
let {actions, state$} = createState(actionsTree);
actions = attach(actions, 'audio', audio.actions);
```

**Service Pattern:**
```javascript
// Standardized service pattern
module.exports = {
  actions: { initial, ... },
  hook: ({state$, actions}) => { ... },
  unhook: () => { ... }
};
```

---

## Key Architectural Differences

### 1. State Management

**js-loop-station:**
- Uses custom `app.adapt()` and `app.attach()` functions
- Manual stream management with `BehaviorSubject`
- Custom action stream handling

**jam-station/xAmplR:**
- Uses `iblokz-state` library (`createState`, `attach`)
- Standardized action patterns
- Built-in state stream management

**Benefits of iblokz-state:**
- Consistent API across projects
- Built-in action stream management
- Better TypeScript support (if needed)
- Standardized patterns

### 2. Build System

**js-loop-station:**
- Browserify (legacy bundler)
- Manual SASS compilation
- Manual asset copying
- Separate watch processes

**jam-station/xAmplR:**
- Parcel 2 (zero-config bundler)
- Built-in SASS support
- Automatic asset handling
- Single dev server

### 3. RxJS Usage

**js-loop-station:**
```javascript
// Legacy rx 4.x API
const $ = Rx.Observable;
$.fromEvent(...)
  .flatMap(...)
  .subscribe(...);
```

**jam-station/xAmplR:**
```javascript
// Modern rxjs 7.x API
const {fromEvent} = require('rxjs');
const {mergeMap, map} = require('rxjs/operators');
fromEvent(...)
  .pipe(mergeMap(...), map(...))
  .subscribe(...);
```

---

## Feature Comparison

| Feature | js-loop-station | jam-station | xAmplR |
|---------|----------------|-------------|---------|
| **Core Purpose** | 4-channel loop station | Music production DAW | Audio sampler/pad controller |
| **Recording** | ✅ 4 channels | ✅ Multi-track | ✅ Single channel |
| **MIDI Support** | ✅ Basic | ✅ Full | ✅ Full |
| **Audio Effects** | ✅ LFO, Reverb, ADSR | ✅ Full synth engine | ✅ VCF, Reverb |
| **Quantization** | ✅ | ❌ | ❌ |
| **Overdubbing** | ✅ | ❌ | ❌ |
| **Visualization** | ✅ Canvas analyser | ✅ Piano roll | ✅ Waveform editor |
| **Sample Library** | ❌ | ✅ | ✅ (Audio Commons) |
| **Sequencer** | ❌ | ✅ | ❌ |
| **Piano Roll** | ❌ | ✅ | ❌ |
| **OSC Support** | ❌ | ✅ | ❌ |
| **Testing** | ❌ | ✅ Playwright | ✅ Playwright |

---

## Key Findings

### Strengths of js-loop-station

1. **Unique Features**: 4-channel loop station with quantization and overdubbing
2. **Focused Purpose**: Specialized for live looping performance
3. **Functional Architecture**: Clean service-based structure
4. **MIDI Integration**: Basic but functional MIDI support

### Areas for Modernization

1. **Build System**: Browserify → Parcel 2
2. **State Management**: Custom → iblokz-state
3. **RxJS**: rx 4.x → rxjs 7.x
4. **Testing**: None → Playwright E2E
5. **Package Manager**: npm → pnpm
6. **Dependencies**: Many outdated packages

### Unique Value

- **Quantization**: Key differentiator not found in other projects
- **Overdubbing**: Layered recording capability
- **4-Channel Architecture**: Specialized for multi-track looping

---

## Recommendations

1. **Preserve Core Functionality**: The 4-channel loop station functionality is unique and should be preserved
2. **Modernize Foundation**: Align build tools and state management with other projects
3. **Standardize Patterns**: Adopt service patterns from jam-station/xAmplR
4. **Add Testing**: Implement E2E tests for critical workflows
5. **Update Dependencies**: Modernize all dependencies to latest compatible versions

---

## Next Steps

See the modernization plan document for detailed migration steps:
- `planning/2024-12-19-01-modernization-plan.md`
