import {expect} from "#framework/assertions"
import {trap} from "#framework/util"

import {normalize_dash_pattern} from "@bokehjs/models/glyphs/webgl/dash_cache"
import {version} from "@bokehjs/version"

describe("WebGL dash patterns", () => {
  it("should normalize odd-length patterns without mutating the input", () => {
    const input = [3, 1, 2]
    expect(normalize_dash_pattern(input)).to.be.equal([3, 1, 2, 3, 1, 2])
    expect(input).to.be.equal([3, 1, 2])
  })

  it("should treat empty and all-zero patterns as solid", () => {
    expect(normalize_dash_pattern([])).to.be.equal([])
    expect(normalize_dash_pattern([0, 0])).to.be.equal([])
    expect(normalize_dash_pattern([0])).to.be.equal([])
  })

  it("should warn and ignore non-integer, negative, and non-finite lengths", () => {
    for (const pattern of [[2, 0.5], [2, -1], [2, NaN], [2, Infinity]]) {
      const out = trap(() => expect(normalize_dash_pattern(pattern)).to.be.equal([]))
      expect(out.warn).to.be.equal(`[bokeh ${version}] invalid line dash pattern: ${pattern.join(",")}\n`)
    }
  })
})
