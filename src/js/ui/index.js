'use strict';

// dom
const {
	header, section, button, span, h1,
	h4, i, hr, canvas, input,
	fieldset, legend, label, select, option
} = require('iblokz-snabbdom-helpers');
const {context} = require('../util/audio');
// components
const suspended = require('./suspended');
const channel = require('./channel');

// console.log(context.state);

module.exports = ({state, actions}) => section('#ui',
	(console.log(context.state),
	context.state === 'suspended')
	? suspended({state, actions})
	: [
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
		// fieldset('.midi', [
		// 	legend('MIDI Map'),
		// 	label('Input'),
		// 	select()
		// ]),
		section('.channels',
			Object.keys(state.channels).map(chan => channel({params: state.channels[chan], chan, actions}))
		),
		canvas('#visual')
	]
);
