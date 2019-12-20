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

export default readAsArrayBuffer$;
//# sourceMappingURL=readAsArrayBuffer$.esm.js.map
