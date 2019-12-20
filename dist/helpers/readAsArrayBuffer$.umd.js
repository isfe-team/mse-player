(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global['/readAsArrayBuffer$'] = factory());
}(this, (function () { 'use strict';

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

  return readAsArrayBuffer$;

})));
//# sourceMappingURL=readAsArrayBuffer$.umd.js.map
