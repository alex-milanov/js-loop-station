'use strict';

// dom
const {
	section, button, span, h1,
	h4, i, hr, canvas, input, img,
	fieldset, legend, label, select, option
} = require('iblokz-snabbdom-helpers');
const {context} = require('../util/audio');
const {obj, fn} = require('iblokz-data');
// components
const suspended = require('./suspended');
const header = require('./header');
const audio = require('./audio');
const midi = require('./midi');
const channel = require('./channel');

// console.log(context.state);

module.exports = ({state, actions}) => section('#ui',
	(console.log(context.state),
	context.state === 'suspended')
	? suspended({state, actions})
	: [
		header({state, actions}),
		audio({state, actions}),
		midi({state, actions}),
		section('.global-controls', [
			button({
				on: {click: () => actions.stopAll(context.currentTime)}
			}, [i('.fa.fa-stop'), span('Stop All')]),
			button({
				on: {click: () => actions.playAll(context.currentTime)}
			}, [i('.fa.fa-play'), span('Start All')]),
			button({
				on: {click: () => actions.clearAll(context.currentTime)}
			}, [i('.fa.fa-trash-o'), span('Clear All')])
		]),
		section('.channels',
			Object.keys(state.channels).map(chan => channel({params: state.channels[chan], chan, actions}))
		),
		canvas('#visual')
	]
);
