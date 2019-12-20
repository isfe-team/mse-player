/**
 * bufferToBase64
 */
function bufferToBase64Wav(buffer) {
    var content = new Uint8Array(buffer).reduce(function (data, byte) {
        return data + String.fromCharCode(byte);
    }, '');
    return btoa(content);
}

/**
 * bufferToBase64Wav
 */
function bufferToBase64Wav$1(buffer) {
    return "data:audio/wav;base64," + bufferToBase64Wav(buffer);
}

/**
 * addWavHeader
 */
function addWavHeader(samples, sampleRate, sampleBits, channelCount) {
    var dataLength = samples.byteLength;
    var buffer = new ArrayBuffer(44 + dataLength);
    var view = new DataView(buffer);
    function writeString(view, offset, str) {
        for (var i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }
    var offset = 0;
    /* 资源交换文件标识符 */
    writeString(view, offset, 'RIFF');
    offset += 4;
    /* 下个地址开始到文件尾总字节数,即文件大小-8 */
    view.setUint32(offset, /*32*/ 36 + dataLength, true);
    offset += 4;
    /* WAV文件标志 */
    writeString(view, offset, 'WAVE');
    offset += 4;
    /* 波形格式标志 */
    writeString(view, offset, 'fmt ');
    offset += 4;
    /* 过滤字节,一般为 0x10 = 16 */
    view.setUint32(offset, 16, true);
    offset += 4;
    /* 格式类别 (PCM形式采样数据) */
    view.setUint16(offset, 1, true);
    offset += 2;
    /* 通道数 */
    view.setUint16(offset, channelCount, true);
    offset += 2;
    /* 采样率,每秒样本数,表示每个通道的播放速度 */
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    /* 波形数据传输率 (每秒平均字节数) 通道数×每秒数据位数×每样本数据位/8 */
    view.setUint32(offset, sampleRate * channelCount * (sampleBits / 8), true);
    offset += 4;
    /* 快数据调整数 采样一次占用字节数 通道数×每样本的数据位数/8 */
    view.setUint16(offset, channelCount * (sampleBits / 8), true);
    offset += 2;
    /* 每样本数据位数 */
    view.setUint16(offset, sampleBits, true);
    offset += 2;
    /* 数据标识符 */
    writeString(view, offset, 'data');
    offset += 4;
    /* 采样数据总数,即数据总大小-44 */
    view.setUint32(offset, dataLength, true);
    offset += 4;
    function floatTo32BitPCM(output, offset, input) {
        var i32xs = new Int32Array(input);
        for (var i = 0; i < i32xs.length; i++, offset += 4) {
            output.setInt32(offset, i32xs[i], true);
        }
    }
    function floatTo16BitPCM(output, offset, input) {
        var i16xs = new Int16Array(input);
        for (var i = 0; i < i16xs.length; i++, offset += 2) {
            output.setInt16(offset, i16xs[i], true);
        }
    }
    function floatTo8BitPCM(output, offset, input) {
        var i8xs = new Int8Array(input);
        for (var i = 0; i < i8xs.length; i++, offset++) {
            output.setInt8(offset, i8xs[i]);
        }
    }
    if (sampleBits === 16) {
        floatTo16BitPCM(view, 44, samples);
    }
    else if (sampleBits === 8) {
        floatTo8BitPCM(view, 44, samples);
    }
    else {
        floatTo32BitPCM(view, 44, samples);
    }
    return view.buffer;
}

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
 * pcmToWav
 * @example
 * pcmToWav(file).then((src) => $audio.src = src)
 */
function pcmToWav(file, sampleRate, sampleBits, channelCount) {
    if (sampleRate === void 0) { sampleRate = 16000; }
    if (sampleBits === void 0) { sampleBits = 16; }
    if (channelCount === void 0) { channelCount = 1; }
    return readAsArrayBuffer$(file).then(function (buffer) {
        return bufferToBase64Wav$1(addWavHeader(buffer, sampleRate, sampleBits, channelCount));
    });
}

export default pcmToWav;
//# sourceMappingURL=pcmToWav.esm.js.map
