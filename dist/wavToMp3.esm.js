import lamejs from 'lamejs';

/**
 * use [lamejs](https://github.com/zhuker/lamejs#real-example) to encode mp3
 * @todo
 *  - [ ] to `ts`
 */
function wavToMp3(buffers) {
    return Promise.all(buffers.map(function (buf) { return new Promise(function (resolve, reject) {
        var wav = lamejs.WavHeader.readHeader(new DataView(buf));
        var samples = new Int16Array(buf, wav.dataOffset, wav.dataLen / 2);
        var buffer = [];
        var mp3enc = new lamejs.Mp3Encoder(wav.channels, wav.sampleRate, 128);
        var remaining = samples.length;
        var maxSamples = 1152;
        for (var i = 0; remaining >= maxSamples; i += maxSamples) {
            var mono = samples.subarray(i, i + maxSamples);
            var mp3buf = mp3enc.encodeBuffer(mono);
            if (mp3buf.length > 0) {
                buffer.push(new Int8Array(mp3buf));
            }
            remaining -= maxSamples;
        }
        var flush = mp3enc.flush();
        if (flush.length > 0) {
            buffer.push(new Int8Array(flush));
        }
        var blob = new Blob(buffer, { type: 'audio/mpeg' });
        var reader = new FileReader();
        reader.addEventListener('load', function () {
            resolve(reader.result);
        });
        reader.addEventListener('error', function (error) {
            reject(error);
        });
        reader.readAsArrayBuffer(blob);
    }); }));
}

export default wavToMp3;
//# sourceMappingURL=wavToMp3.esm.js.map
