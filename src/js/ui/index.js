'use strict';

// dom
const {header, section, button, span, h1, i, hr, canvas, input} = require('iblokz/adapters/vdom');
// components
const channel = require('./channel');

module.exports = ({state, actions}) => section('#ui', [
	header([
		h1('JS Loop Station'),
		button('.toggle-audio', {on: {click: () => actions.toggle('audio')}}, [
			i(({
				class: {
					'fa': true,
					'fa-toggle-on': state.audio,
					'fa-toggle-off': !state.audio
				}
			})),
			span('Toggle Audio')
		])
	]),
	section('.channels',
		Object.keys(state.channels).map(chan => channel({params: state.channels[chan], chan, actions}))
	),
	canvas('#visual')
]);
