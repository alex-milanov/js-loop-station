'use strict';

// dom
const {header, section, button, span, h1, i, hr, canvas, input} = require('iblokz/adapters/vdom');
// components
const channel = require('./channel');

module.exports = ({state, actions}) => section('#ui', [
	header([
		h1('JS Loop Station'),
		button('.toggle.big[title="Monitor On/Off"]', {on: {click: () => actions.toggle('mic')}}, [
			i(({
				class: {
					'fa': true,
					'fa-microphone': state.mic,
					'fa-microphone-slash': !state.mic
				}
			}))
		]),
		button('.toggle[title="Audio Input On/Off"]', {on: {click: () => actions.toggle('audio')}}, [
			i(({
				class: {
					'fa': true,
					'fa-toggle-on': state.audio,
					'fa-toggle-off': !state.audio
				}
			})),
			span('Audio Input')
		]),
		button('.toggle[title="Quantize On/Off"]', {on: {click: () => actions.toggle('quantize')}}, [
			i(({
				class: {
					'fa': true,
					'fa-check-square-o': state.quantize,
					'fa-square-o': !state.quantize
				}
			})),
			span('Quantize')
		])
	]),
	section('.channels',
		Object.keys(state.channels).map(chan => channel({params: state.channels[chan], chan, actions}))
	),
	canvas('#visual')
]);
