'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const record = stream => {
	let mediaRecorder = new window.MediaRecorder(stream, {mimeType: 'audio/webm\;codecs=opus', audioBitsPerSecond: 128000});
	let chunks = [];
	mediaRecorder.start();

	let data$ = new Rx.Subject();

	mediaRecorder.ondataavailable = e => {
		chunks.push(e.data);
		console.log({chunk: e.data});
	};

	mediaRecorder.onstop = () => {
		data$.onNext(chunks.length === 1 ? chunks[0] : new Blob(chunks, {type: 'audio/ogg; codecs=opus'}));
	};

	return {
		data$,
		stop: () => mediaRecorder.stop()
	};
};

module.exports = {
	record
};
