/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/**
 * @example
 * const player = new MSEPlayer()
 * player.appendFiles(files)
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API
 */
var MSEPlayer = /** @class */ (function () {
    function MSEPlayer(option) {
        var _this = this;
        if (option === void 0) { option = {}; }
        var _a = option.files, files = _a === void 0 ? [] : _a, _b = option.mimeType, mimeType = _b === void 0 ? 'audio/mpeg' : _b, onError = option.onError, _c = option.ignoreError, ignoreError = _c === void 0 ? true : _c, _d = option.transformer, transformer = _d === void 0 ? identity : _d;
        this.envSupported = MSEPlayer.checkEnvSupported();
        this.onError = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (isFunction(onError)) {
                onError.call.apply(onError, __spread([_this], args));
            }
        };
        if (!this.envSupported) {
            this.onError(genError('MEDIA_SOURCE_NOT_SUPPORTED'));
            return;
        }
        if (!MediaSource.isTypeSupported(mimeType)) {
            this.onError(genError('MIME_TYPE_NOT_SUPPORTED'));
            return;
        }
        this.mimeType = mimeType;
        this.sourceBuffer = null;
        this.ignoreError = ignoreError;
        this.transformer = transformer;
        this.mediaSource = new MediaSource();
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var player = this;
        function onSourceOpenWithPromise() {
            return new Promise(function (resolve) {
                var mediaSource = player.mediaSource;
                mediaSource.addEventListener('sourceopen', onSourceOpen);
                function onSourceOpen() {
                    mediaSource.removeEventListener('sourceopen', onSourceOpen);
                    player.sourceBuffer = mediaSource.addSourceBuffer(player.mimeType);
                    resolve();
                }
            });
        }
        this.lastAppend$ = onSourceOpenWithPromise();
        if (files.length > 0) {
            this.appendFiles(files);
        }
    }
    MSEPlayer.checkEnvSupported = function () {
        return 'MediaSource' in window;
    };
    /**
     * appendFiles
     */
    MSEPlayer.prototype.appendFiles = function (files, transformer, ignorePrevError) {
        var _this = this;
        if (files === void 0) { files = []; }
        if (transformer === void 0) { transformer = identity; }
        if (ignorePrevError === void 0) { ignorePrevError = true; }
        files = toArray(files);
        if (ignorePrevError) {
            this.lastAppend$.catch(function () { });
        }
        var combinedTransformer = function (buffers) {
            return Promise.resolve(buffers)
                .then(transformer) // specific transformer
                .then(function (buffers) { return _this.transformer(buffers); }); // common transformer
        };
        var currentAppend$ = this.lastAppend$.then(function () { return combine(files, _this.mediaSource, _this.sourceBuffer, combinedTransformer); });
        this.lastAppend$ = currentAppend$.catch(function (err) {
            _this.onError(genError('APPEND_ERROR', err));
        });
        return this.ignoreError ? this.lastAppend$ : currentAppend$;
    };
    MSEPlayer.prototype.destroy = function () {
        this.mediaSource = null;
        this.sourceBuffer = null;
    };
    return MSEPlayer;
}());
/**
 * readBuffer - read blobs and get arrayBuffers
 */
function read(blobs) {
    return Promise.all(blobs.map(function (blob) {
        return new Promise(function (resolve, reject) {
            // hmmm, no need to unbind, if it's smart enough
            var reader = new FileReader();
            reader.addEventListener('load', function () {
                // the result must be `ArrayBuffer`
                resolve(reader.result);
            });
            reader.readAsArrayBuffer(blob);
            reader.addEventListener('error', function (err) {
                reject(genError('READ_FILE_ERROR', err));
            });
        });
    }));
}
/**
 * buffer - append buffers to specific sourceBuffer
 */
function buffer(mediaSource, sourceBuffer, buffers) {
    return new Promise(function (resolve, reject) {
        sourceBuffer.addEventListener('updateend', onUpdateEnd);
        sourceBuffer.addEventListener('error', onAppendError);
        // it's async when `appendBuffer`,
        // we should use `updateend` event(triggers when `append` or `removed`) to ensure the orders
        function onUpdateEnd() {
            if (buffers.length === 0) {
                mediaSource.endOfStream();
                // don't forget to remove
                sourceBuffer.removeEventListener('updateend', onUpdateEnd);
                sourceBuffer.removeEventListener('error', onAppendError);
                resolve();
                return;
            }
            sourceBuffer.appendBuffer(buffers.shift());
        }
        function onAppendError(err) {
            // no need to unbind `updateend` and invoke `endOfStream` here,
            // because when `error` occurs, `updateend` will go according to the spec.
            // @see https://w3c.github.io/media-source/#sourcebuffer-append-error
            reject(genError('APPEND_BUFFER_ERROR', err));
        }
        // trigger first buffer
        onUpdateEnd();
    });
}
/**
 * combine - combine the `read` process and the `buffer` process
 * to ensure the `read` process is excuted before the `buffer` process.
 * just a combination.
 */
function combine(files, mediaSource, sourceBuffer, transformer) {
    return read(files).then(function (buffers) { return transformer(buffers); }).then(function (buffers) { return buffer(mediaSource, sourceBuffer, buffers); });
}
/**
 * identity
 */
function identity(x) {
    return x;
}
/**
 * isFunction
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFunction(x) {
    return Object.prototype.toString.call(x) === '[object Function]';
}
/**
 * toArray
 */
function toArray(xs) {
    return [].slice.call(xs);
}
/**
 * genError
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function genError(type, error) {
    return {
        type: type,
        error: error
    };
}

export default MSEPlayer;
//# sourceMappingURL=MSEPlayer-esm.js.map
