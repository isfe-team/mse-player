import lamejs from 'lamejs';

/**
 * Simple helper | bqliu
 */
function readAsArrayBuffer$(x) {
    return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        // hmmm, no need to unbind, if it's smart enough
        fr.addEventListener('load', function () { return resolve(fr.result); });
        fr.addEventListener('error', function (e) { return reject(e); });
        fr.readAsArrayBuffer(x);
    });
}

/**
 * use [lamejs](https://github.com/zhuker/lamejs#real-example) to encode mp3
 *
 * BE CARE, if use rollup to import lamejs, you will fail, so you need to use
 * [rollup-plugin-external-globals](https://github.com/eight04/rollup-plugin-external-globals)
 * ```js
 * // simple rollup config
 * const config = {
 *   plugins: [nodeResolve(), commonjs(), rollupTypescript(), externalGlobals({ lamejs: 'lamejs' })]
 * }
 * ```
 * @todo
 *  - [ ] pcmToMp3
 */
function wavToMp3(mp3enc, buffers, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.kbps, kbps = _c === void 0 ? 128 : _c, _d = _b.flush, flush = _d === void 0 ? true : _d, _e = _b.optimize // if optimize, we'll slice into pieces, but it will result in unbelivable result
    , optimize = _e === void 0 ? false : _e // if optimize, we'll slice into pieces, but it will result in unbelivable result
    ;
    return Promise.all(buffers.map(function (buf) {
        var wav = lamejs.WavHeader.readHeader(new DataView(buf));
        var samples = new Int16Array(buf, wav.dataOffset, wav.dataLen / 2);
        var buffer = [];
        if (!mp3enc) {
            mp3enc = new lamejs.Mp3Encoder(wav.channels, wav.sampleRate, kbps);
        }
        if (optimize) {
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
        }
        else {
            var mp3buf = mp3enc.encodeBuffer(samples);
            buffer.push(new Int8Array(mp3buf));
        }
        if (flush) {
            var end = mp3enc.flush();
            if (end.length > 0) {
                buffer.push(new Int8Array(end));
            }
        }
        var blob = new Blob(buffer, { type: 'audio/mpeg' });
        return readAsArrayBuffer$(blob);
    }));
}

export default wavToMp3;
//# sourceMappingURL=wavToMp3.esm.js.map
