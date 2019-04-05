'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {obj, arr} = require('iblokz-data');

// util
const a = require('./util/audio');
window.a = a;

// app
const app = require('./util/app');
let actions = app.adapt(require('./actions'));
let ui = require('./ui');
let actions$;
const state$ = new Rx.BehaviorSubject();
// services
// visuals
let visuals = require('./services/visuals.js');
// audio
let audio = require('./services/audio.js');
actions = app.attach(actions, 'audio', audio.actions);
// midi
let midi = require('./services/midi.js');
actions = app.attach(actions, 'midi', midi.actions);

// shared objects

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'audio', audio.actions);
		actions = app.attach(actions, 'midi', midi.actions);
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.stream.onNext(state => state);
	});
	// services
	// visuals
	module.hot.accept("./services/visuals.js", function() {
		visuals.unhook();
		visuals = require('./services/visuals.js');
		visuals.hook({state$, actions});
		actions.ping();
	});
	// audio
	module.hot.accept("./services/audio.js", function() {
		audio.unhook();
		audio = require('./services/audio.js');
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'audio', audio.actions);
		actions = app.attach(actions, 'midi', midi.actions);
		audio.hook({state$, actions});
		actions.ping();
	});
	// midi
	module.hot.accept("./services/midi.js", function() {
		midi.unhook();
		midi = require('./services/midi.js');
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'audio', audio.actions);
		actions = app.attach(actions, 'midi', midi.actions);
		midi.hook({state$, actions});
		actions.ping();
	});
} else {
	actions$ = actions.stream;
}

// actions -> state
actions$
	.map(action => (
		action.path && console.log(action.path.join('.'), action.payload),
		console.log(action),
		action)
	)
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	.map(state => (console.log(state), state))
	.subscribe(state => state$.onNext(state));

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '#ui');

// hooks
visuals.hook({state$, actions});
audio.hook({state$, actions});
midi.hook({state$, actions});

// livereload impl.
if (module.hot) {
	document.write(`<script src="http://${(location.host || 'localhost').split(':')[0]}` +
	`:35729/livereload.js?snipver=1"></script>`);
}
