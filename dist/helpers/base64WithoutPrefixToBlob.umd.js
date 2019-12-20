(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global['/base64WithoutPrefixToBlob'] = factory());
}(this, (function () { 'use strict';

  function base64WithoutPrefixToBlob (str, options) {
      var bstr = atob(str);
      var n = bstr.length;
      var u8arr = new Uint8Array(n);
      while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], options);
  }

  return base64WithoutPrefixToBlob;

})));
//# sourceMappingURL=base64WithoutPrefixToBlob.umd.js.map
