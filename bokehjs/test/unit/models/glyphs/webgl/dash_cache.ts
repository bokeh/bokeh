import {expect} from "#framework/assertions"

import {DashCache, normalize_dash_pattern} from "@bokehjs/models/glyphs/webgl/dash_cache"
import type {Regl} from "regl"

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

  it("should retain fractional dash lengths", () => {
    expect(normalize_dash_pattern([1.5, 0.5])).to.be.equal([1.5, 0.5])
  })

  it("should create fractional dash textures without integer GCD sizing", () => {
    let options: {shape?: number[]} | undefined
    const regl = {
      texture(value: {shape?: number[]}) {
        options = value
        return {}
      },
    } as unknown as Regl

    const [info, _texture, scale] = new DashCache(regl).get([1.5, 0.25])
    expect(options?.shape).to.be.equal([128, 1, 1])
    expect(info[0]).to.be.equal(1.75)
    expect(scale).to.be.equal(1)
  })

  it("should reject negative and non-finite lengths", () => {
    expect(() => normalize_dash_pattern([2, -1])).to.throw()
    expect(() => normalize_dash_pattern([2, NaN])).to.throw()
    expect(() => normalize_dash_pattern([2, Infinity])).to.throw()
  })
})
