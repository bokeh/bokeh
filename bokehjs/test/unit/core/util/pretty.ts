import {expect} from "assertions"

import {to_string} from "@bokehjs/core/util/pretty"

describe("core/util/pretty module", () => {
  describe("implements to_string() function", () => {
    it("that supports number type", () => {
      expect(to_string(-1)).to.be.equal("-1")
      expect(to_string(0)).to.be.equal("0")
      expect(to_string(1)).to.be.equal("1")
      expect(to_string(NaN)).to.be.equal("NaN")
      expect(to_string(Infinity)).to.be.equal("Infinity")
      expect(to_string(-Infinity)).to.be.equal("-Infinity")
    })

    it("that supports string type", () => {
      expect(to_string("")).to.be.equal('""')
      expect(to_string("a")).to.be.equal('"a"')
      expect(to_string("a'b'c")).to.be.equal('"a\'b\'c"')
      expect(to_string('a"b"c')).to.be.equal("'a\"b\"c'")
      expect(to_string("a`b`c")).to.be.equal('"a`b`c"')
      expect(to_string("a'`b`c")).to.be.equal('"a\'`b`c"')
      expect(to_string('a"`b`c')).to.be.equal("'a\"`b`c'")
      expect(to_string('a"`b\'`c')).to.be.equal("`a\"\\`b'\\`c`")
    })

    it("that supports symbol type", () => {
      expect(to_string(Symbol())).to.be.equal("Symbol()")
      expect(to_string(Symbol("a"))).to.be.equal("Symbol(a)")
    })

    it("that supports T[]", () => {
      expect(to_string([])).to.be.equal("[]")
      expect(to_string([1, 2, 3])).to.be.equal("[1, 2, 3]")
    })

    it("that supports Map<K, V>", () => {
      expect(to_string(new Map())).to.be.equal("Map([])")
      expect(to_string(new Map([[1, true], [2, false], [3, true]]))).to.be.equal("Map([[1, true], [2, false], [3, true]])")
    })

    it("that supports Set<V>", () => {
      expect(to_string(new Set())).to.be.equal("Set([])")
      expect(to_string(new Set([1, 2, 3]))).to.be.equal("Set([1, 2, 3])")
    })

    it("that supports {[key: string | number]: V}", () => {
      expect(to_string({})).to.be.equal("{}")
      expect(to_string(new Map([[1, true], [2, false], [3, true]]))).to.be.equal("Map([[1, true], [2, false], [3, true]])")
    })

    it("that supports ArrayBuffer", () => {
      const buf0 = new Uint8Array([]).buffer
      expect(to_string(buf0)).to.be.equal("ArrayBuffer(#0)")

      const buf1 = new Uint8Array([1, 2, 3]).buffer
      expect(to_string(buf1)).to.be.equal("ArrayBuffer(#3)")

      const buf2 = new Uint32Array([1, 2, 3, 4]).buffer
      expect(to_string(buf2)).to.be.equal("ArrayBuffer(#16)")
    })

    it("that supports circular objects", () => {
      type X = {y: number, z?: X}
      const x: X = {y: 1}
      x.z = x
      expect(to_string(x)).to.be.equal("{y: 1, z: <circular>}")
    })
  })
})
