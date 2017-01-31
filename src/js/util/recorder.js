'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const noop = () => {};

const _MediaRecorder = function(stream, options, ctx) {
	this._state = window.RecordingState.inactive;
	this._stream = stream;

	this._encoder = new window.VorbisEncoder();
	this._chunks = [];

	this._ctx = ctx || new AudioContext();
	this._sourceNode = this._ctx.createMediaStreamSource(stream);
	this._procNode = this._ctx.createScriptProcessor(4096);

	this._onstart = noop;
	this._ondataavailable = noop;
	this._onstop = noop;

	// ---

	this._encoder.ondata = this.handleEncoderData.bind(this);

	this._encoder.onfinish = this.handleEncoderFinish.bind(this);

	this._procNode.onaudioprocess = this.handleAudioProcess.bind(this);
};

_MediaRecorder.prototype = Object.create(window.VorbisMediaRecorder.prototype);
_MediaRecorder.prototype.constructor = _MediaRecorder;

const record = (stream, ctx) => {
	// let mediaRecorder = new window.MediaRecorder(stream);
	let mediaRecorder = new _MediaRecorder(stream, {audioBitsPerSecond: 32000}, ctx);
	// mediaRecorder.mimeType = 'audio/ogg';
	let chunks = [];
	mediaRecorder.start();

	let data$ = new Rx.Subject();

	mediaRecorder.ondataavailable = e => {
		chunks.push(e.data);
		console.log({chunk: e.data});
	};

	mediaRecorder.onstop = () => {
		data$.onNext(chunks.length === 1 ? chunks[0] : new Blob(chunks, {type: chunks[0].type}));
	};

	return {
		data$,
		stop: () => mediaRecorder.stop()
	};
};

module.exports = {
	record
};
