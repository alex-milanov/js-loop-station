'use strict';

// dom
const {
	header, section, button, span, h1,
	h4, i, hr, canvas, input, img,
	fieldset, legend, label, select, option
} = require('iblokz-snabbdom-helpers');
const {context} = require('../util/audio');
const {obj, fn} = require('iblokz-data');
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
			])
		]),
		fieldset('.audio', [
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
		]),
		fieldset('.midi', [
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
		]),
		section('.channels',
			Object.keys(state.channels).map(chan => channel({params: state.channels[chan], chan, actions}))
		),
		canvas('#visual')
	]
);
