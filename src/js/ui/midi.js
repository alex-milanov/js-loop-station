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

module.exports = ({state, actions}) => fieldset('.midi', [
	legend(img(`[src="assets/midi.svg"]`)),
	label('Input'),
	select(`[name="device"]`, {
		props: {value: state.midi.device},
		on: {change: ev => actions.set(['midi', 'device'], ev.target.value)}
	}, [].concat(
		option(`[value="-1"]`, {
			attrs: {
				selected: state.midi.device === '-1'
			}
		}, 'Any device'),
		(obj.sub(state, ['midi', 'devices', 'inputs']) || []).map((device, k) =>
			option(`[value="${device.id}"]`, {
				attrs: {
					selected: device.id === state.midi.device
				}
			}, device.name)
		)
	)),
	label('Channel'),
	input(`[name="channel"][type="number"][size="3"]`, {
		props: {value: state.midi.channel},
		on: {input: ev => actions.set(['midi', 'channel'], parseInt(ev.target.value, 10))}
	}),
	button('.right', {
		class: {
			on: state.midi.setup
		},
		on: {
			click: () => actions.toggle(['midi', 'setup'])
		}
	}, i('.fa.fa-sliders'))
]);
