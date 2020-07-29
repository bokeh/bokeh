import "es5-ext/object/assign/implement"
import "es5-ext/object/entries/implement"
import "es5-ext/number/is-integer/implement"
import "es5-ext/string/#/repeat/implement"
import "es5-ext/array/from/implement"
import "es5-ext/array/#/fill/implement"
import "es5-ext/math/log10/implement"
import "es5-ext/math/log1p/implement"
import "es6-set/implement"
import "es6-map/implement"
import "es6-weak-map/implement"
import "es6-symbol/implement"

import "es6-promise/auto"

if (typeof Object.is === "undefined") {
  Object.is = function(val1: any, val2: any): boolean {
    return val1 === val2 ? val1 !== 0 || 1 / val1 === 1 / val2 : isNaN(val1) && isNaN(val2)
  }
}

if (typeof Object.values === "undefined") {
  Object.values = function(obj: {[key: string]: unknown}) {
    return Object.keys(obj).map((key) => obj[key])
  }
}

if (typeof Uint8Array.prototype.fill === "undefined") {
  (Uint8Array.prototype as any).fill = Array.prototype.fill
}
if (typeof Int8Array.prototype.fill === "undefined") {
  (Int8Array.prototype as any).fill = Array.prototype.fill
}
if (typeof Uint16Array.prototype.fill === "undefined") {
  (Uint16Array.prototype as any).fill = Array.prototype.fill
}
if (typeof Int16Array.prototype.fill === "undefined") {
  (Int16Array.prototype as any).fill = Array.prototype.fill
}
if (typeof Uint32Array.prototype.fill === "undefined") {
  (Uint32Array.prototype as any).fill = Array.prototype.fill
}
if (typeof Int32Array.prototype.fill === "undefined") {
  (Int32Array.prototype as any).fill = Array.prototype.fill
}
if (typeof Float32Array.prototype.fill === "undefined") {
  (Float32Array.prototype as any).fill = Array.prototype.fill
}
if (typeof Float64Array.prototype.fill === "undefined") {
  (Float64Array.prototype as any).fill = Array.prototype.fill
}

// fixes up a problem with some versions of IE11
// ref: http://stackoverflow.com/questions/22062313/imagedata-set-in-internetexplorer
if (typeof CanvasPixelArray !== "undefined") {
  CanvasPixelArray.prototype.set = function(this: any, arr: any[]): void {
    for (let i = 0; i < this.length; i++) {
      this[i] = arr[i]
    }
  }
}
