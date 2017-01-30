'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// iblokz
const vdom = require('iblokz/adapters/vdom');
const obj = require('iblokz/common/obj');
const arr = require('iblokz/common/arr');

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
const state$ = actions$
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	.map(state => (console.log(state), state))
	.share();

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
			source.node.connect(vca.node);
			source.stream = stream;
			gfx.visualize(analyser, document.querySelector('#visual').getContext('2d'));
		});
	} else if (source.node) {
		source.node.disconnect();
		source.node = null;
		source.stream = null;
	}
});

let buffers = [];
let recording;
let blob$ = new Rx.Subject();

blob$
	.filter(blob => blob !== false)
	// .map(blob => (console.log({blob}), blob))
	.flatMap(blob => file.load(blob, 'arrayBuffer'))
	.map(arrayBuffer => (console.log({arrayBuffer}), arrayBuffer))
	.subscribe(arrayBuffer =>
		a.context.decodeAudioData(arrayBuffer).then(buffer => {
			console.log(buffer);
			let bufferSource = a.context.createBufferSource();
			bufferSource.buffer = buffer;
			bufferSource.loop = true;
			bufferSource.connect(vca.node);
			bufferSource.start();
			buffers.push(bufferSource);
		}, err => console.log({err, arrayBuffer}))
	);

state$.distinctUntilChanged(state => state.channels[0].process)
	.subscribe(state => {
		if (state.audio) {
			if (state.channels[0].process === 'record' || state.channels[0].process === 'overdub') {
				console.log(rec.record, source.stream);
				recording = rec.record(source.stream);
				recording.data$.subscribe(blob => blob$.onNext(blob));
			} else if (state.channels[0].process === 'play') {
				if (recording) {
					recording.stop();
					recording = null;
				}
				buffers = buffers.map(old => {
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
				buffers.forEach(bufferSource => bufferSource.stop());
				if (state.channels[0].process === 'empty')
					buffers = [];
			}
		}
	});

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
		27: ['change', '3', 'gain']
	}
};

// hook midi signals
// midi.access$.subscribe(); // data => actions.midiMap.connect(data));

if (midi) midi.msg$
	.map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw}))
	.filter(data => data.msg.binary !== '11111000') // ignore midi clock for now
	.map(data => (console.log(`midi: ${data.msg.binary}`, data.msg), data))
	// .withLatestFrom(state$, (data, state) => ({data, state}))
	// .subscribe(({data, state}) => {
	.subscribe(data => {
		let mmap;
		let value;
		switch (data.msg.state) {
			case 'noteOn':
				if (data.msg.channel === 10) {
					mmap = midiMap.pads[data.msg.note.number];
					// if (data.msg.note.channel !== 10) noteOn(state.instrument, data.msg.note, data.msg.velocity);
					if (actions[mmap[0]] && actions[mmap[0]] instanceof Function)
						actions[mmap[0]](mmap[1], mmap[2]);
				}
				break;
			case 'noteOff':
				break;
			case 'controller':
				mmap = midiMap.controller[data.msg.controller];
				console.log({mmap});
				value = parseFloat(
					(mmap[4] || 0) + data.msg.value * (mmap[4] || 1) - data.msg.value * (mmap[3] || 0)
				).toFixed(mmap[5] || 3);
				value = (mmap[5] === 0) ? parseInt(value, 10) : parseFloat(value);
				if (actions[mmap[0]] && actions[mmap[0]] instanceof Function)
					actions[mmap[0]](mmap[1], mmap[2], value);
				break;
			default:
				break;
		}
	});
