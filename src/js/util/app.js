'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const arr = require('iblokz/common/arr');
const obj = require('iblokz/common/obj');

const adapt = o => Object.keys(o).filter(key => key !== 'initial').reduce((o2, key) => Object.assign({}, o2,
	(o[key] instanceof Function) && obj.keyValue(key, function() {
		const resp = o[key].apply(null, arr.fromList(arguments));
		o2.stream.onNext(resp);
	}) || (o[key] instanceof Object) && (() => {
		let o3 = adapt(o[key]);
		return Object.assign({
			stream: $.merge(o2.stream, o3.stream),
			initial: Object.assign({}, o2.initial, obj.keyValue(key, o3.initial))
		}, obj.keyValue(key, o3));
	})() || obj.keyValue(key, o[key])
), {stream: new Rx.Subject(), initial: o.initial || {}});

module.exports = {
	adapt
};
