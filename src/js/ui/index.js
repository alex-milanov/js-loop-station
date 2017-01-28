'use strict';

// dom
const {section, button, span, h1, i} = require('iblokz/adapters/vdom');
// components
const counter = require('./counter');

module.exports = ({state, actions}) => section('#ui', [
	h1('JS Loop Station'),
	button({on: {click: () => actions.trigger()}}, [i('.fa.fa-play')])
]);
