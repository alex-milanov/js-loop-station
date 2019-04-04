'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {obj, arr} = require('iblokz-data');

// util
const a = require('./util/audio');
window.a = a;
const midi = require('./util/midi')();

// app
const app = require('./util/app');
let actions = app.adapt(require('./actions'));
let ui = require('./ui');
let actions$;
const state$ = new Rx.BehaviorSubject();
// services
// visuals
let visuals = require('./services/visuals.js');
// audio
let audio = require('./services/audio.js');

// shared objects

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(require('./actions'));
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.stream.onNext(state => state);
	});
	// services
	// visuals
	module.hot.accept("./services/visuals.js", function() {
		visuals.unhook();
		visuals = require('./services/visuals.js');
		visuals.hook({state$, actions});
		actions.ping();
	});
	// audio
	module.hot.accept("./services/audio.js", function() {
		audio.unhook();
		audio = require('./services/audio.js');
		audio.hook({state$, actions});
		actions.ping();
	});
} else {
	actions$ = actions.stream;
}

// actions -> state
actions$
	.map(action => (
		action.path && console.log(action.path.join('.'), action.payload),
		console.log(action),
		action)
	)
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	.map(state => (console.log(state), state))
	.subscribe(state => state$.onNext(state));

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '#ui');

// hooks
visuals.hook({state$, actions});
audio.hook({state$, actions});

let midiMap = {
	pads: {
		// 60: ['playRec', '0'],
		// 61: ['playRec', '1'],
		// 62: ['playRec', '2'],
		// 63: ['playRec', '3'],
		// 64: ['stop', '0'],
		// 65: ['stop', '1'],
		// 66: ['stop', '2'],
		// 67: ['stop', '3'],
		36: ['playRec', '0'],
		37: ['playRec', '1'],
		38: ['playRec', '2'],
		39: ['playRec', '3'],
		40: ['stop', '0'],
		41: ['stop', '1'],
		42: ['stop', '2'],
		43: ['stop', '3']
	},
	controller: {
		24: ['change', '0', 'gain'],
		25: ['change', '1', 'gain'],
		26: ['change', '2', 'gain'],
		27: ['change', '3', 'gain'],
		64: ['playRec']
	}
};

// hook midi signals
// midi.access$.subscribe(); // data => actions.midiMap.connect(data));

if (midi) midi.msg$
	.map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw}))
	.filter(data => data.msg.binary !== '11111000') // ignore midi clock for now
	.map(data => (console.log(`midi: ${data.msg.binary}`, data.msg), data))
	.withLatestFrom(state$, (data, state) => ({data, state}))
	.subscribe(({data, state}) => {
	// .subscribe(data => {
		let mmap;
		let value;
		switch (data.msg.state) {
			case 'noteOn':
				if (midiMap.pads[data.msg.note.number] && data.msg.channel === 1) {
					mmap = midiMap.pads[data.msg.note.number];
					// if (data.msg.note.channel !== 10) noteOn(state.instrument, data.msg.note, data.msg.velocity);
					if (actions[mmap[0]] && actions[mmap[0]] instanceof Function)
						actions[mmap[0]](mmap[1], mmap[2]);
				}
				break;
			case 'noteOff':
				break;
			case 'controller':
				if (midiMap.controller[data.msg.controller]) {
					mmap = midiMap.controller[data.msg.controller];
					if (mmap[0] === 'playRec') {
						if (data.msg.value === 1) actions.playRec(state.lastAffected);
					} else {
						value = parseFloat(
							(mmap[4] || 0) + data.msg.value * (mmap[4] || 1) - data.msg.value * (mmap[3] || 0)
						).toFixed(mmap[5] || 3);
						value = (mmap[5] === 0) ? parseInt(value, 10) : parseFloat(value);
						if (actions[mmap[0]] && actions[mmap[0]] instanceof Function)
							actions[mmap[0]](mmap[1], mmap[2], value);
					}
				}
				break;
			default:
				break;
		}
	});

// livereload impl.
if (module.hot) {
	document.write(`<script src="http://${(location.host || 'localhost').split(':')[0]}` +
	`:35729/livereload.js?snipver=1"></script>`);
}
