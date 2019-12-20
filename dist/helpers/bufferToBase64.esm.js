/**
 * bufferToBase64
 */
function bufferToBase64Wav(buffer) {
    var content = new Uint8Array(buffer).reduce(function (data, byte) {
        return data + String.fromCharCode(byte);
    }, '');
    return btoa(content);
}

export default bufferToBase64Wav;
//# sourceMappingURL=bufferToBase64.esm.js.map
