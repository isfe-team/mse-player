function base64WithoutPrefixToBlob (str, options) {
    var bstr = atob(str);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], options);
}

export default base64WithoutPrefixToBlob;
//# sourceMappingURL=base64WithoutPrefixToBlob.esm.js.map
