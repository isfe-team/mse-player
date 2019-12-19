(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.base64ToBlob = factory());
}(this, (function () { 'use strict';

  function strToBase64 (str, options) {
      var bstr = atob(str);
      var n = bstr.length;
      var u8arr = new Uint8Array(n);
      while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], options);
  }

  function base64ToBlob(str, options) {
      return strToBase64(str.split(',')[1], options);
  }

  return base64ToBlob;

})));
//# sourceMappingURL=base64ToBlob.umd.js.map
