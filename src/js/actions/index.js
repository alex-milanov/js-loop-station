'use strict';

const obj = require('iblokz/common/obj');

// initial
const initial = {
	audioOn: false,
	channels: {
		0: {process: 'idle', gain: 0.5, layers: 0},
		1: {process: 'idle', gain: 0.5, layers: 0},
		2: {process: 'idle', gain: 0.5, layers: 0},
		3: {process: 'idle', gain: 0.5, layers: 0}
	}
};

// actions
const toggle = path => state => obj.patch(state, path, !obj.sub(state, path));
const change = (channel, param, value) => state => obj.patch(state, ['channels', channel, param], value);
/*
const playRec = channel => state => obj.patch(state, ['channels', channel, 'process'],
	(state.channels[channel].process === 'idle')
		? (state.channels[channel].layers === 0) ? 'record' : 'play'
		: (state.channels[channel].process === 'record' || state.channels[channel].process === 'play')
			? 'overdub' : 'play'
);
*/

const playRec = channel => state => obj.patch(state, ['channels', channel, 'process'],
	(state.channels[channel].process === 'idle' || state.channels[channel].process === 'play')
		? 'record'
		: 'play'
);

const stop = channel => state => obj.patch(state, ['channels', channel, 'process'], 'idle');

// layers
const addLayer = channel =>
	state => obj.patch(state, ['channels', channel, 'layers'], state.channels[channel].layers + 1);
const clear = channel => state => obj.patch(state, ['channels', channel, 'layers'], 0);

module.exports = {
	initial,
	toggle,
	change,
	playRec,
	stop,
	addLayer,
	clear
};
