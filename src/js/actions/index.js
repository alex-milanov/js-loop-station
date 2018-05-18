'use strict';

const {arr, obj} = require('iblokz-data');

// initial
const initial = {
	audio: false,
	mic: false,
	lastAffected: '0',
	baseLength: 0,
	quantize: false,
	channels: {
		0: {process: 'empty', gain: 0.5, layers: 0},
		1: {process: 'empty', gain: 0.5, layers: 0},
		2: {process: 'empty', gain: 0.5, layers: 0},
		3: {process: 'empty', gain: 0.5, layers: 0}
	}
};

// actions
const toggle = path => state => obj.patch(state, path, !obj.sub(state, path));

const change = (channel, param, value) => state => Object.assign(
	obj.patch(state, ['channels', channel, param], value),
	{
		lastAffected: channel
	}
);

const playRec = channel => state => Object.assign(obj.patch(state, ['channels', channel], {
	layers: ['record', 'overdub'].indexOf(state.channels[channel].process) > -1
		? state.channels[channel].layers + 1
		: state.channels[channel].layers,
	process: (state.audio)
		? (state.channels[channel].process === 'empty') ? 'record'
			: (state.channels[channel].process === 'play')
				? 'overdub' : 'play'
		: state.channels[channel].process
}), {
	lastAffected: channel
});

/*
const playRec = channel => state => obj.patch(state, ['channels', channel, 'process'],
	(state.channels[channel].process === 'idle' || state.channels[channel].process === 'play')
		? 'record'
		: 'play'
);
*/

const stop = channel => state => Object.assign(obj.patch(state, ['channels', channel], {
	layers: ['record', 'overdub'].indexOf(state.channels[channel].process) > -1
		? state.channels[channel].layers + 1
		: state.channels[channel].layers,
	process: (state.channels[channel].process !== 'empty')
		?	'idle'
		: 'empty'
}), {
	lastAffected: channel
});

// layers

const clear = channel => state => Object.assign(obj.patch(state, ['channels', channel], {
	process: 'empty',
	layers: 0
}), {
	lastAffected: channel,
	// if all are clear set baseLength to 0
	baseLength: (Object.keys(state.channels)
		.filter(c => c !== channel)
		.filter(c => state.channels[c].layers > 0)
		.length > 0)
		? state.baseLength
		: 0
});

const setBaseLength = baseLength => state => Object.assign({}, state, {baseLength});

module.exports = {
	initial,
	toggle,
	change,
	playRec,
	stop,
	clear,
	setBaseLength
};
