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
  (Uint8Array.prototype as any).fill = Array.prototype.fill;
  (Int8Array.prototype as any).fill = Array.prototype.fill;
  (Uint16Array.prototype as any).fill = Array.prototype.fill;
  (Int16Array.prototype as any).fill = Array.prototype.fill;
  (Uint32Array.prototype as any).fill = Array.prototype.fill;
  (Int32Array.prototype as any).fill = Array.prototype.fill;
  (Float32Array.prototype as any).fill = Array.prototype.fill;
  (Float64Array.prototype as any).fill = Array.prototype.fill
}

if (typeof Array.prototype[Symbol.iterator] === "undefined") {
  function iterator(this: Array<unknown>) {
    let i = 0
    const self = this
    return {
      next() {
        const done = self.length <= i
        const value = done ? undefined : self[i++]
        return {value, done}
      },
    }
  }
  (function() {
    arguments.constructor.prototype[Symbol.iterator] = iterator;
    (Array.prototype as any)[Symbol.iterator] = iterator;
    (Uint8Array.prototype as any)[Symbol.iterator] = iterator;
    (Int8Array.prototype as any)[Symbol.iterator] = iterator;
    (Uint16Array.prototype as any)[Symbol.iterator] = iterator;
    (Int16Array.prototype as any)[Symbol.iterator] = iterator;
    (Uint32Array.prototype as any)[Symbol.iterator] = iterator;
    (Int32Array.prototype as any)[Symbol.iterator] = iterator;
    (Float32Array.prototype as any)[Symbol.iterator] = iterator;
    (Float64Array.prototype as any)[Symbol.iterator] = iterator
  })()
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
