import {expect, expect_instanceof} from "#framework/assertions"

import {DashCache, normalize_dash_pattern} from "@bokehjs/models/glyphs/webgl/dash_cache"
import type {Regl, Texture2D, Texture2DOptions} from "regl"

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

  it("should create and cache fractional dash texture data without integer GCD sizing", () => {
    let options: Texture2DOptions | undefined
    let texture_calls = 0
    const texture = {} as Texture2D
    const regl = {
      texture(value: Texture2DOptions) {
        texture_calls++
        options = value
        return texture
      },
    } as unknown as Regl

    const cache = new DashCache(regl)
    const cached = cache.get([1.5, 0.25])
    const [info, cached_texture, scale] = cached
    expect(options?.shape).to.be.equal([128, 1, 1])
    expect(info).to.be.equal([1.75, -0.0068359375, -0.125, 0.75])
    expect(scale).to.be.equal(1)
    expect(cached_texture).to.be.identical(texture)

    expect_instanceof(options?.data, Uint8Array)
    expect(options.data.length).to.be.equal(128)
    expect([options.data[0], options.data[55], options.data[119], options.data[127]]).to.be.equal([36, 254, 1, 32])

    expect(cache.get([1.5, 0.25])).to.be.identical(cached)
    expect(texture_calls).to.be.equal(1)
  })

  it("should reject negative and non-finite lengths", () => {
    expect(() => normalize_dash_pattern([2, -1])).to.throw()
    expect(() => normalize_dash_pattern([2, NaN])).to.throw()
    expect(() => normalize_dash_pattern([2, Infinity])).to.throw()
  })
})
