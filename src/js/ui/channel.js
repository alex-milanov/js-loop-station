'use strict';

const {section, button, span, i, input} = require('iblokz-snabbdom-helpers');

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
		class: {
			play: params.process === 'play',
			record: params.process === 'record',
			overdub: params.process === 'overdub'
		},
		on: {click: () => actions.playRec(chan)}
	}, '')
]);
