'use strict';

const {section, button, span} = require('iblokz/adapters/vdom');

module.exports = ({state, actions}) => section('.counter', [
	button({on: {click: () => actions.decr()}}, 'Decrease'),
	span(`Number:`),
	span('[contenteditable="true"]', {
		on: {input: ev => actions.set(parseInt(ev.target.textContent, 10))}
	}, state.number),
	button({on: {click: () => actions.incr()}}, 'Increase')
]);
