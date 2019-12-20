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

export default bufferToBase64Wav$1;
//# sourceMappingURL=helpersbufferToBase64Wav.esm.js.map
