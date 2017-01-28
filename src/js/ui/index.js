'use strict';

// dom
const {section, button, span, h1, i, hr, canvas} = require('iblokz/adapters/vdom');
// components
const counter = require('./counter');

module.exports = ({state, actions}) => section('#ui', [
	h1('JS Loop Station'),
	button('.btn', {on: {click: () => actions.toggle('audio')}}, [
		i(({
			class: {
				'fa': true,
				'fa-toggle-on': state.audioOn,
				'fa-toggle-off': !state.audioOn
			}
		})),
		span('Toggle Audio')
	]),
	hr(),
	button('.trigger.record', {
		class: {active: state.recording},
		on: {click: () => actions.toggle('recording')}
	}, [i('.fa.fa-circle')]),
	button('.trigger.play', {
		class: {active: state.playing},
		on: {click: () => actions.toggle('playing')}
	}, [i('.fa.fa-play')]),
	canvas('#visual')
]);
