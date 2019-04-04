'use strict';

const {obj, fn} = require('iblokz-data');

const midi = require('../util/midi');

// util
const indexAt = (a, k, v) => a.reduce((index, e, i) => ((obj.sub(e, k) === v) ? i : index), -1);
const prepVal = (min = 0, max = 1, digits = 3) => val =>
	[(min + val * max - val * min).toFixed(digits)]
		.map(val =>
			(digits === 0) ? parseInt(val, 10) : parseFloat(val)
		)
		.pop();

let unhook = () => {};

const clockMsg = [248];    // note on, middle C, full velocity

const hook = ({state$, actions, tapTempo}) => {
	let subs = [];

	const {devices$, msg$} = midi.init();

	// midi device access
	subs.push(
		devices$.subscribe(data => actions.midiMap.connect(data))
	);

	const parsedMidiMsg$ = msg$
		.map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw}))
		// .map(data => (console.log(data), data))
		.share();

	const getIds = (inputs, indexes) => inputs
		.map(inp => inp.id)
		.filter((id, i) => indexes.indexOf(i) > -1);

	const midiState$ = parsedMidiMsg$
		.withLatestFrom(state$, (data, state) => ({data, state}))
		.filter(({data, state}) => getIds(state.midiMap.devices.inputs, state.midiMap.data.in).indexOf(
			data.raw.input.id
		) > -1)
		.share();

	// midi messages
	subs.push(
		parsedMidiMsg$
			// .map(midiData => (console.log({midiData}), midiData))
			.filter(({msg}) => ['noteOn', 'noteOff'].indexOf(msg.state) > -1)
			.withLatestFrom(state$, (midiData, state) => (Object.assign({}, midiData, {state})))
			.filter(({raw, state}) => (
				// console.log(raw.input.id, state.midiMap.devices.inputs, state.midiMap.data.in),
				getIds(state.midiMap.devices.inputs, state.midiMap.data.in).indexOf(
					raw.input.id
				) > -1
			))
			.subscribe(({raw, msg, state}) => {
				// console.log(state.midiMap.devices.inputs, raw.input);
				const deviceIndex = state.midiMap.devices.inputs.indexOf(raw.input);

				actions.midiMap.noteOn(
					deviceIndex,
					msg.channel,
					msg.note.key + msg.note.octave,
					msg.velocity || 0
				);

				if (msg.state === 'noteOn' && (
					[-1, deviceIndex].indexOf(state.session.tracks[0].input.device) > -1
					&& msg.channel === state.session.tracks[0].input.channel
				)
					&& state.studio.playing && state.studio.recording && state.studio.tick.index > -1) {
					setTimeout(
						() => actions.sequencer.update(
							state.sequencer.bar, msg.note.number - 60, state.studio.tick.index + 1, msg.velocity),
						100
					);
				}
			})
	);

	subs.push(
		parsedMidiMsg$
			// .map(midiData => (console.log({midiData}), midiData))
			.filter(({msg}) => ['pitchBend'].indexOf(msg.state) > -1)
			.throttle(1)
			.subscribe(({msg}) => actions.set(['midiMap', 'pitch'], msg.pitchValue))
	);

	subs.push(
		parsedMidiMsg$
			.filter(({msg}) => msg.state === 'bankSelect')
			.filter(({msg}) => msg.bank >= 0 && msg.bank < 16)
			.subscribe(({msg}) =>
				fn.pipe(
					() => ({
						track: msg.bank % 4,
						row: parseInt(
							(msg.bank >= 4 && msg.bank < 8
							|| msg.bank >= 12 && msg.bank < 16
								? msg.bank - 4
								: msg.bank + 4) / 4,
							10
						)
					}),
					({track, row}) => (
						actions.session.activate(track, row),
						actions.session.select(track, row)
					)
				)()
			)
	);

	// controller
	subs.push(
		midiState$
			.filter(({data}) => data.msg.state === 'controller')
			.distinctUntilChanged(({data}) => data.msg.value)
			.throttle(10)
			.subscribe(({data, state}) => {
				let mmap = state.midiMap.map.find(m =>
					m[0] === data.msg.state
					&& m[1] === data.msg.controller
				);
				// console.log(mmap);
				if (mmap) {
					let [msgType, msgVal, propPath, ...valMods] = mmap;
					// vca
					if (propPath[0] === 'instrument' && propPath[1] === 'eg')
						propPath = ['instrument', `vca${state.instrument.vcaOn + 1}`, propPath[2]];
					// value
					let val = prepVal(...valMods)(data.msg.value);
					// console.log(propPath, val);
					actions.change(propPath[0], propPath.slice(1), val);
				}
			})
		);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
