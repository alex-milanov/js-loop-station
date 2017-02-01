'use strict';

const obj = require('iblokz/common/obj');

// initial
const initial = {
	audioOn: false,
	channels: {
		0: {process: 'empty', gain: 0.5, layers: 0},
		1: {process: 'empty', gain: 0.5, layers: 0},
		2: {process: 'empty', gain: 0.5, layers: 0},
		3: {process: 'empty', gain: 0.5, layers: 0}
	}
};

// actions
const toggle = path => state => obj.patch(state, path, !obj.sub(state, path));
const change = (channel, param, value) => state => obj.patch(state, ['channels', channel, param], value);

const playRec = channel => state => obj.patch(state, ['channels', channel, 'process'],
	(state.audio)
		? (state.channels[channel].process === 'empty') ? 'record'
			: (state.channels[channel].process === 'play')
				? 'overdub' : 'play'
		: state.channels[channel].process
);

/*
const playRec = channel => state => obj.patch(state, ['channels', channel, 'process'],
	(state.channels[channel].process === 'idle' || state.channels[channel].process === 'play')
		? 'record'
		: 'play'
);
*/

const stop = channel => state => obj.patch(state, ['channels', channel, 'process'],
	(state.channels[channel].process !== 'empty')
		?	'idle'
		: 'empty'
);

// layers

const clear = channel => state => obj.patch(state, ['channels', channel, 'process'], 'empty');

module.exports = {
	initial,
	toggle,
	change,
	playRec,
	stop,
	clear
};
