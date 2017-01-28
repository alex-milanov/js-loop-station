'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// iblokz
const vdom = require('iblokz/adapters/vdom');
const obj = require('iblokz/common/obj');
const arr = require('iblokz/common/arr');

// util
const a = require('./util/audio');
const gfx = require('./util/gfx');

// app
const app = require('./util/app');
let actions = app.adapt(require('./actions'));
let ui = require('./ui');
let actions$;

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(require('./actions'));
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.stream.onNext(state => state);
	});
} else {
	actions$ = actions.stream;
}

// actions -> state
const state$ = actions$
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	.map(state => (console.log(state), state))
	.share();

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '#ui');

// hooks
let source = {
	type: 'soundSource',
	node: null,
	out: []
};

const vca = a.vca({gain: 0.5});

var analyser = a.context.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;
analyser.connect(a.context.destination);

vca.node.connect(analyser);

state$.distinctUntilChanged(state => state.audio).subscribe(state => {
	if (state.audio) {
		navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
			a.disconnect(source, vca);
			source.node = a.context.createMediaStreamSource(stream);
			source.node.connect(vca.node);
			gfx.visualize(analyser, document.querySelector('#visual').getContext('2d'));
		});
	} else if (source.node) {
		source.node.disconnect();
		source.node = null;
	}
});
