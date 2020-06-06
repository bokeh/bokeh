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
      expect(to_string("a'b'c")).to.be.equal('"a\\\'b\\\'c"')
    })

    it("that supports T[]", () => {
      expect(to_string([])).to.be.equal('[]')
      expect(to_string([1, 2, 3])).to.be.equal('[1, 2, 3]')
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
  })
})
