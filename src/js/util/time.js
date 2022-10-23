'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const raf = require('raf');

const tick = cb => raf(function(dt) {
	cb(dt);
	tick(cb);
});

const frame = () => $.create(
	obs => tick(dt => obs.onNext(dt))
)
	.filter(dt => dt !== 0)
	.share();

const loop = (state$, node) => frame(node).withLatestFrom(state$, (dt, state) => ({dt, state}));

module.exports = {
	frame,
	loop
};
