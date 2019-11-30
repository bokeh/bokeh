import "es5-ext/object/assign/implement"
import "es5-ext/number/is-integer/implement"
import "es5-ext/string/#/repeat/implement"
import "es5-ext/array/from/implement"
import "es5-ext/math/log10/implement"
import "es5-ext/math/log1p/implement"
import "es6-set/implement"
import "es6-map/implement"
import "es6-weak-map/implement"

import "es6-promise/auto"

// fixes up a problem with some versions of IE11
// ref: http://stackoverflow.com/questions/22062313/imagedata-set-in-internetexplorer
if (typeof CanvasPixelArray !== "undefined") {
  CanvasPixelArray.prototype.set = function(this: any, arr: any[]): void {
    for (let i = 0; i < this.length; i++) {
      this[i] = arr[i]
    }
  }
}
