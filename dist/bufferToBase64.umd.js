(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.bufferToBase64 = factory());
}(this, (function () { 'use strict';

  /**
   * bufferToBase64
   */
  function bufferToBase64(buffer) {
      var content = new Uint8Array(buffer).reduce(function (data, byte) {
          return data + String.fromCharCode(byte);
      }, '');
      return "data:audio/wav;base64," + btoa(content);
  }

  return bufferToBase64;

})));
//# sourceMappingURL=bufferToBase64.umd.js.map
