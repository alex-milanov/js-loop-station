'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const bufferUtils = require('audio-buffer-utils');

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {obj, arr} = require('iblokz-data');

// util
const a = require('./util/audio');
const file = require('./util/file');
const midi = require('./util/midi')();
const rec = require('./util/recorder');
const gfx = require('./util/gfx');

// app
const app = require('./util/app');
let actions = app.adapt(require('./actions'));
let ui = require('./ui');
let actions$;
const state$ = new Rx.BehaviorSubject();

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
let source = {
	type: 'soundSource',
	node: null,
	stream: null,
	out: []
};

const vca = a.vca({gain: 0.5});

let analyser = a.context.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;
analyser.connect(a.context.destination);

vca.node.connect(analyser);

state$.distinctUntilChanged(state => state.audio).subscribe(state => {
	if (state.audio) {
		navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
			a.disconnect(source, vca);
			source.node = a.context.createMediaStreamSource(stream);
			if (state.mic) source.node.connect(a.context.destination);
			source.stream = stream;
			gfx.visualize(analyser, document.querySelector('#visual').getContext('2d'));
		});
	} else if (source.node) {
		source.node.disconnect();
		source.node = null;
		source.stream = null;
	}
});

state$.distinctUntilChanged(state => state.mic).subscribe(state => {
	if (state.mic) source.node.connect(a.context.destination);
	else if (source.node) source.node.disconnect();
});

let buffers = {};
let recording = {};
let blob$ = new Rx.Subject();

const addNewSample = (channel, buffer, baseLength, quantize = false) => {
	// quantize buffer
	let length = buffer.length;
	if (quantize) {
		if (baseLength === 0) {
			length = Number(length / 4).toFixed() * 4;
			actions.setBaseLength(length);
		} else {
			let quant = baseLength / 4;
			length = Number(length / quant).toFixed() * quant;
		}
	}
	console.log({buffer, length, baseLength});
	let resizedBuffer = bufferUtils.resize(buffer, length);
	console.log(
		buffer, buffer instanceof AudioBuffer,
		resizedBuffer, resizedBuffer instanceof AudioBuffer
	);
	let bufferSource = a.context.createBufferSource();
	bufferSource.buffer = resizedBuffer;
	bufferSource.loop = true;
	bufferSource.connect(vca.node);
	bufferSource.start();
	if (!buffers[channel]) buffers[channel] = [];
	buffers[channel].push(bufferSource);
};

[0, 1, 2, 3].map(channel =>
	state$.distinctUntilChanged(state => state.channels[channel].process)
		.subscribe(state => {
			if (state.audio) {
				if (state.channels[channel].process === 'record' || state.channels[channel].process === 'overdub') {
					console.log(rec.record, source.stream);
					recording[channel] = rec.record(source.stream, a.context);
					recording[channel].data$
						.flatMap(data => file.load(data, 'arrayBuffer'))
						.flatMap(arrayBuffer => $.fromPromise(a.context.decodeAudioData(arrayBuffer)))
						.subscribe(buffer => addNewSample(channel, buffer, state.baseLength, state.quantize));
				} else if (state.channels[channel].process === 'play') {
					if (recording[channel]) {
						recording[channel].stop();
						recording[channel] = null;
					}
					if (buffers[channel]) buffers[channel] = buffers[channel].map(old => {
						old.stop();
						let bufferSource = a.context.createBufferSource();
						bufferSource.buffer = old.buffer;
						bufferSource.loop = true;
						bufferSource.connect(vca.node);
						bufferSource.start();
						return bufferSource;
					});
				} else {
					// stop`
					if (buffers[channel]) buffers[channel].forEach(bufferSource => bufferSource.stop());
					if (state.channels[channel].process === 'empty')
						buffers[channel] = [];
				}
			}
		})
	);

let midiMap = {
	pads: {
		60: ['playRec', '0'],
		61: ['playRec', '1'],
		62: ['playRec', '2'],
		63: ['playRec', '3'],
		64: ['stop', '0'],
		65: ['stop', '1'],
		66: ['stop', '2'],
		67: ['stop', '3']
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
				if (midiMap.pads[data.msg.note.number] && data.msg.channel === 10) {
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
