'use strict';

const a = require('../util/audio');

const {section, button, span, i, input} = require('iblokz-snabbdom-helpers');

const calcProgress = (start, current, duration) =>
	(((current - start) % duration) / duration * 100);

module.exports = ({params, chan, actions}) => section('.channel', [
	button('.stop', {
		on: {
			click: () => actions.stop(chan),
			dblclick: () => actions.clear(chan)
		}
	}, [i('.fa.fa-stop')]),
	input('.vertical[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: params.gain}
	}),
	button('.play-rec.record', {
		style: {
			'--pgPercentage': params.process === 'play'
				? calcProgress(params.startedAt, a.context.currentTime, params.duration) : 0
		},
		class: {
			play: params.process === 'play',
			record: params.process === 'record',
			overdub: params.process === 'overdub'
		},
		on: {click: () => actions.playRec(chan, a.context.currentTime)}
	}, '')
]);
