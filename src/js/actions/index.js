'use strict';

const {arr, obj} = require('iblokz-data');

// initial
const initial = {
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

const set = (key, value) => state => obj.patch(state, key, value);
const toggle = key => state => obj.patch(state, key, !obj.sub(state, key));
const arrToggle = (key, value) => state =>
	obj.patch(state, key,
		arr.toggle(obj.sub(state, key), value)
	);

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
	process: (state.audio.on)
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

const ping = () => state => state;

module.exports = {
	initial,
	set,
	toggle,
	arrToggle,
	change,
	playRec,
	stop,
	clear,
	setBaseLength,
	ping
};
