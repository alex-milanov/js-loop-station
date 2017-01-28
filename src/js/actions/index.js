'use strict';

const obj = require('iblokz/common/obj');

// initial
const initial = {
	audioOn: false,
	recording: false,
	playing: false
};

// actions
const toggle = prop => state => obj.patch(state, prop, !state[prop]);

module.exports = {
	initial,
	toggle
};
