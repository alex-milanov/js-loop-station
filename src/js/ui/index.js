'use strict';

// dom
const {section, button, span, h1, i, hr, canvas, input} = require('iblokz/adapters/vdom');
// components
const counter = require('./counter');

module.exports = ({state, actions}) => section('#ui', [
	h1('JS Loop Station'),
	button('.btn', {on: {click: () => actions.toggle('audio')}}, [
		i(({
			class: {
				'fa': true,
				'fa-toggle-on': state.audio,
				'fa-toggle-off': !state.audio
			}
		})),
		span('Toggle Audio')
	]),
	hr(),
	button('.stop', {
		on: {
			click: () => actions.stop(),
			dblClick: () => actions.clear()
		}
	}, [i('.fa.fa-stop')]),
	input('.vertical[type="range"]'),
	button('.play-rec.record', {
		class: {
			play: state.playRec === 'play',
			record: state.playRec === 'record',
			overdub: state.playRec === 'overdub'
		},
		on: {click: () => actions.playRec()}
	}, ''),
	canvas('#visual')
]);
