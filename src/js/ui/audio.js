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

module.exports = ({state, actions}) => fieldset('.audio', [
	legend(i('.fa.fa-microphone')),
	label('Input'),
	select(`[name="audioDevice0"]`, {
		props: {value: state.audio.deviceInputs[0]},
		on: {change: ev => actions.set(['audio', 'deviceInputs', 0], ev.target.value)}
	}, [].concat(
		state.audio.devices.map((device, k) =>
			option(`[value="${device.deviceId}"]`, {
				attrs: {
					selected: device.deviceId === state.audio.deviceInputs[0]
				}
			}, device.label)
		)
	)),
	select(`[name="audioDevice1"]`, {
		props: {value: state.audio.deviceInputs[1]},
		on: {change: ev => actions.set(['audio', 'deviceInputs', 1], ev.target.value)}
	}, [].concat(
		state.audio.devices.map((device, k) =>
			option(`[value="${device.deviceId}"]`, {
				attrs: {
					selected: device.deviceId === state.audio.deviceInputs[1]
				}
			}, device.label)
		)
	)),
	select(`[name="audioDevice2"]`, {
		props: {value: state.audio.deviceInputs[2]},
		on: {change: ev => actions.set(['audio', 'deviceInputs', 2], ev.target.value)}
	}, [].concat(
		state.audio.devices.map((device, k) =>
			option(`[value="${device.deviceId}"]`, {
				attrs: {
					selected: device.deviceId === state.audio.deviceInputs[2]
				}
			}, device.label)
		)
	)),
	select(`[name="audioDevice3"]`, {
		props: {value: state.audio.deviceInputs[3]},
		on: {change: ev => actions.set(['audio', 'deviceInputs', 3], ev.target.value)}
	}, [].concat(
		state.audio.devices.map((device, k) =>
			option(`[value="${device.deviceId}"]`, {
				attrs: {
					selected: device.deviceId === state.audio.deviceInputs[3]
				}
			}, device.label)
		)
	))
]);
