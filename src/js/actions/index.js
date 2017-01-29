'use strict';

const obj = require('iblokz/common/obj');

// initial
const initial = {
	audioOn: false,
	playRec: 'idle'
};

// actions
const toggle = prop => state => obj.patch(state, prop, !state[prop]);
const playRec = () => state => obj.patch(state, 'playRec',
	(state.playRec === 'idle' || state.playRec === 'play')
		? 'record'
		: (state.playRec === 'record')
			? 'overdub' : 'play'
);
const stop = () => state => obj.patch(state, 'playRec', 'idle');
const clear = () => state => state;

module.exports = {
	initial,
	toggle,
	playRec,
	stop,
	clear
};
