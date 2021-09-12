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
  Object.is = function(a: any, b: any): boolean {
    if (a === b)
      return a !== 0 || 1/a === 1/b
    else
      return a !== a && b !== b
  }
}

if (typeof Object.values === "undefined") {
  Object.values = function(obj: {[key: string]: unknown}) {
    return Object.keys(obj).map((key) => obj[key])
  }
}

if (typeof String.prototype.includes === "undefined") {
  String.prototype.includes = function(search: string, start: number = 0): boolean {
    return this.indexOf(search, start) != -1
  }
}

if (typeof Uint8Array.prototype.fill === "undefined") {
  const fill = Array.prototype.fill as any
  Uint8Array.prototype.fill = fill
  Int8Array.prototype.fill = fill
  Uint16Array.prototype.fill = fill
  Int16Array.prototype.fill = fill
  Uint32Array.prototype.fill = fill
  Int32Array.prototype.fill = fill
  Float32Array.prototype.fill = fill
  Float64Array.prototype.fill = fill
}

import {inplace_map} from "core/util/arrayable"

if (typeof Uint8Array.from === "undefined") {
  function from(this: any, ctor: any): any {
    const that = this
    return function(arrayLike: Iterable<number>, mapfn?: (v: number, k: number) => number, thisArg?: any): any {
      const arr = new ctor([...arrayLike])
      if (mapfn != null)
        inplace_map(arr, (v: number, k) => mapfn.call(thisArg ?? that, v, k))
      return arr
    }
  }
  Uint8Array.from = from(Uint8Array)
  Int8Array.from = from(Int8Array)
  Uint16Array.from = from(Uint16Array)
  Int16Array.from = from(Int16Array)
  Uint32Array.from = from(Uint32Array)
  Int32Array.from = from(Int32Array)
  Float32Array.from = from(Float32Array)
  Float64Array.from = from(Float64Array)
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
    arguments.constructor.prototype[Symbol.iterator] = iterator
    Array.prototype[Symbol.iterator] = iterator as any
    Uint8Array.prototype[Symbol.iterator] = iterator as any
    Int8Array.prototype[Symbol.iterator] = iterator as any
    Uint16Array.prototype[Symbol.iterator] = iterator as any
    Int16Array.prototype[Symbol.iterator] = iterator as any
    Uint32Array.prototype[Symbol.iterator] = iterator as any
    Int32Array.prototype[Symbol.iterator] = iterator as any
    Float32Array.prototype[Symbol.iterator] = iterator as any
    Float64Array.prototype[Symbol.iterator] = iterator as any
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
