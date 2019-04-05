'use strict';

const webAudioBuilder = require('waveform-data/webaudio');
const audioContext = require('../util/audio').context;

const clear = ctx => ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.width);

const visualize = (analyser, ctx) => {
	const visualSetting = 'sinewave';

	ctx.canvas.width = ctx.canvas.offsetWidth;
	ctx.canvas.height = ctx.canvas.offsetHeight;

	if (visualSetting === "sinewave") {
		analyser.fftSize = 2048;
		let bufferLength = analyser.fftSize;
		console.log(bufferLength);
		let dataArray = new Uint8Array(bufferLength);

		clear(ctx);

		const draw = () => {
			let drawVisual = requestAnimationFrame(draw);

			analyser.getByteTimeDomainData(dataArray);

			// ctx.fillStyle = '#f7f8ff';
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			// ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			ctx.lineWidth = 2;
			ctx.strokeStyle = 'rgb(0, 0, 0)';

			ctx.beginPath();

			var sliceWidth = Number(ctx.canvas.width) * 1.0 / bufferLength;
			var x = 0;

			for (let i = 0; i < bufferLength; i++) {
				var v = dataArray[i] / 128.0;
				var y = v * ctx.canvas.height / 2;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}

				x += sliceWidth;
			}

			ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
			ctx.stroke();
		};

		draw();
	}
};

module.exports = {
	visualize
};
