'use strict';

const {obj, fn} = require('iblokz-data');

const midi = require('../util/midi');
const pocket = require('../util/pocket');

const initial = {
	device: '-1',
	devices: [],
	channel: 1,
	setup: false,
	clicks: {
		36: ['playRec', '0'],
		37: ['playRec', '1'],
		38: ['playRec', '2'],
		39: ['playRec', '3'],
		40: ['stop', '0'],
		41: ['stop', '1'],
		42: ['stop', '2'],
		43: ['stop', '3']
	},
	dblClicks: {
		40: ['clear', '0'],
		41: ['clear', '1'],
		42: ['clear', '2'],
		43: ['clear', '3']
	},
	controller: {
		24: ['change', '0', 'gain'],
		25: ['change', '1', 'gain'],
		26: ['change', '2', 'gain'],
		27: ['change', '3', 'gain'],
		64: ['playRec']
	}
};

const connect = devices => state => obj.patch(state, 'midi', {
	devices
});

const actions = {
	initial,
	connect
};

let unhook = () => {};

const hook = ({state$, actions, tapTempo}) => {
	let subs = [];

	const {devices$, msg$} = midi.init();
	const parsedMidiMsg$ = msg$
		.map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw}))
		// .map(data => (console.log(data), data))
		.share();

	// midi device access
	subs.push(
		devices$.subscribe(data => actions.midi.connect(data))
	);

	// hook midi signals
	// midi.access$.subscribe(); // data => actions.state.midi.connect(data));
	const midiClicks$ = parsedMidiMsg$.filter(data => data.msg.state === 'noteOn').share();
	const midiDblClicks$ = midiClicks$
		.buffer(midiClicks$.debounce(250))
		.map(list => (console.log(list), list))
		.filter(list => list.length === 2 && list[0].msg.note.number === list[1].msg.note.number)
		.map(list => list[0]);

	midiClicks$
		.withLatestFrom(state$, (data, state) => ({data, state}))
		.filter(({data, state}) => (data.raw.input.id === state.midi.device || state.midi.device === '-1')
			&& state.midi.clicks[data.msg.note.number] && data.msg.channel === state.midi.channel)
		.subscribe(({data, state}) => {
			const mmap = state.midi.clicks[data.msg.note.number];
			if (actions[mmap[0]] && actions[mmap[0]] instanceof Function)
				actions[mmap[0]](mmap[1], mmap[2]);
		});
	midiDblClicks$
		.withLatestFrom(state$, (data, state) => ({data, state}))
		.filter(({data, state}) => (data.raw.input.id === state.midi.device || state.midi.device === '-1')
			&& state.midi.dblClicks[data.msg.note.number] && data.msg.channel === state.midi.channel)
		.subscribe(({data, state}) => {
			console.log('double click');
			const mmap = state.midi.dblClicks[data.msg.note.number];
			if (actions[mmap[0]] && actions[mmap[0]] instanceof Function)
				actions[mmap[0]](mmap[1], mmap[2]);
		});
	// clickStream
  // .buffer(clickStream.debounce(250))
  // .map(list => list.length)
  // .filter(x => x === 2)

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
