'use strict';

// dom
const {
	header, section, button, span, h1,
	h4, i, hr, canvas, input, img,
	fieldset, legend, label, select, option
} = require('iblokz-snabbdom-helpers');
const {context} = require('../util/audio');
const {obj, fn, str} = require('iblokz-data');
// components

// console.log(context.state);

const recordModes = ['independent', 'synced'];

module.exports = ({state, actions}) => header([
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
	button('.toggle[title="Audio Input On/Off"]', {on: {click: () => actions.toggle(['audio', 'on'])}}, [
		i(({
			class: {
				'fa': true,
				'fa-toggle-on': state.audio.on,
				'fa-toggle-off': !state.audio.on
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
	]),
	button('.toggle[title="Record Mode"]', {on: {click: () =>
			actions.set('recordMode', recordModes[((recordModes.indexOf(state.recordMode) + 1) % recordModes.length)])
	}}, [
		i('.fa.fa-dot-circle-o'),
		span(str.capitalize(state.recordMode))
	])
]);
