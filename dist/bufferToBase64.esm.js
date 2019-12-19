/**
 * bufferToBase64
 */
function bufferToBase64(buffer) {
    var content = new Uint8Array(buffer).reduce(function (data, byte) {
        return data + String.fromCharCode(byte);
    }, '');
    return "data:audio/wav;base64," + btoa(content);
}

export default bufferToBase64;
//# sourceMappingURL=bufferToBase64.esm.js.map
