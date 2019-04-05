'use strict';

const {obj, fn} = require('iblokz-data');

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const pocket = require('../util/pocket');
const a = require('../util/audio');
const bufferUtils = require('audio-buffer-utils');
const rec = require('../util/recorder');
const file = require('../util/file');

const initial = {
	on: false,
	deviceInputs: {
		0: 'default',
		1: 'default',
		2: 'default',
		3: 'default'
	},
	devices: []
};

const connect = devices => state => obj.patch(state, 'audio', {
	devices
});

const actions = {
	initial,
	connect
};

let unhook = () => {};

const createAnalyser = context => {
	console.log('Creating analyser');
	let analyser = context.createAnalyser();
	analyser.minDecibels = -90;
	analyser.maxDecibels = -10;
	analyser.smoothingTimeConstant = 0.85;
	analyser.connect(context.destination);
	return analyser;
};

const hook = ({state$, actions}) => {
	let subs = [];

	// devices
	$.fromEvent(navigator.mediaDevices, 'devicechange')
		.startWith({})
		.flatMap(() => $.fromPromise(navigator.mediaDevices.enumerateDevices()))
		.map(devices => devices.filter(d => d.kind === 'audioinput'))
		.subscribe(devices => actions.audio.connect(devices));

	const analyser$ = $.interval(100)
		.map(() => a.context)
		.distinctUntilChanged(context => context.state)
		.filter(context => context.state !== 'suspended')
		.map(createAnalyser);

	let source = [
		{
			type: 'soundSource',
			node: null,
			stream: null,
			out: []
		},
		{
			type: 'soundSource',
			node: null,
			stream: null,
			out: []
		},
		{
			type: 'soundSource',
			node: null,
			stream: null,
			out: []
		},
		{
			type: 'soundSource',
			node: null,
			stream: null,
			out: []
		}
	];

	let vca;

	analyser$.subscribe(analyser => {
		vca = a.vca({gain: 0.5});
		pocket.put('analyser', analyser);
		a.connect(vca, analyser);
	});

	state$
		.distinctUntilChanged(state => state.audio.on + state.audio.deviceInputs)
		// .filter(state => state.audio.on)
		.subscribe(state => {
			[0, 1, 2, 3].forEach(index => {
				if (state.audio.on) {
					navigator.mediaDevices.getUserMedia({audio: {
						deviceId: state.audio.deviceInputs[index]
					}}).then(stream => {
						a.disconnect(source[index], vca);
						source[index].node = a.context.createMediaStreamSource(stream);
						if (state.mic) source[index].node.connect(a.context.destination);
						source[index].stream = stream;
					});
				} else if (source[index].node) {
					source[index].node.disconnect();
					source[index].node = null;
					source[index].stream = null;
				}
			});
		});

	state$.distinctUntilChanged(state => state.mic).subscribe(state => {
		// if (state.mic) source.node.connect(a.context.destination);
		// else if (source.node) source.node.disconnect();
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
		bufferSource.connect(vca.through);
		bufferSource.start();
		if (!buffers[channel]) buffers[channel] = [];
		buffers[channel].push(bufferSource);
	};

	[0, 1, 2, 3].map(channel =>
		state$.distinctUntilChanged(state => state.channels[channel].process)
			.subscribe(state => {
				if (state.audio) {
					if (state.channels[channel].process === 'record' || state.channels[channel].process === 'overdub') {
						console.log(channel, rec.record, source[channel].stream);
						recording[channel] = rec.record(source[channel].stream, a.context);
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
							bufferSource.connect(vca.through);
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

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
