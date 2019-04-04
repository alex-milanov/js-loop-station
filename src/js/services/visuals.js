'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

const gfx = require('../util/gfx');
const pocket = require('../util/pocket');

let unhook = () => {};

const hook = ({state$, actions}) => {
	let subs = [];

	const analyser$ = pocket.stream
		.distinctUntilChanged(p => p.analyser)
		.filter(p => p.analyser)
		.map(pocket => pocket.analyser);

	$.interval(100)
		.map(() => document.querySelector('#visual'))
		.withLatestFrom(state$, analyser$, (el, state, analyser) => ({el, state, analyser}))
		.distinctUntilChanged(({el, state, analyser}) => el + state.audio + analyser)
		.filter(({el, state, analyser}) => el && state.audio && analyser)
		.subscribe(({el, analyser}) => {
			gfx.visualize(analyser, el.getContext('2d'));
		});

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
