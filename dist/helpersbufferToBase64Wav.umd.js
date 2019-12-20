(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.helpersbufferToBase64Wav = factory());
}(this, (function () { 'use strict';

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

  return bufferToBase64Wav$1;

})));
//# sourceMappingURL=helpersbufferToBase64Wav.umd.js.map
