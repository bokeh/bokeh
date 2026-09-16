import {expect, expect_instanceof} from "#framework/assertions"
import {trap} from "#framework/util"

import {DashCache, normalize_dash_pattern} from "@bokehjs/models/glyphs/webgl/dash_cache"
import {version} from "@bokehjs/version"
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

  it("should retain fractional and mixed-zero dash lengths", () => {
    expect(normalize_dash_pattern([1.5, 0.5])).to.be.equal([1.5, 0.5])
    expect(normalize_dash_pattern([0, 1.5])).to.be.equal([0, 1.5])
    expect(normalize_dash_pattern([1.5, 0])).to.be.equal([1.5, 0])
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

  it("should create textures for mixed-zero dash lengths", () => {
    const options: Texture2DOptions[] = []
    const regl = {
      texture(value: Texture2DOptions) {
        options.push(value)
        return {} as Texture2D
      },
    } as unknown as Regl

    const cache = new DashCache(regl)
    const patterns = [[0, 2], [2, 0], [0, 1.5], [1.5, 0]]
    const cached = patterns.map((pattern) => cache.get(pattern))
    expect(cached.map(([info]) => info.every(Number.isFinite))).to.be.equal([true, true, true, true])
    expect(cached.map(([, , scale]) => scale)).to.be.equal([2, 2, 1, 1])
    expect(options.map(({shape}) => shape)).to.be.equal([[2, 1, 1], [2, 1, 1], [128, 1, 1], [128, 1, 1]])
    for (const option of options) {
      expect_instanceof(option.data, Uint8Array)
    }
  })

  it("should warn and ignore negative and non-finite lengths", () => {
    for (const pattern of [[2, -1], [2, NaN], [2, Infinity]]) {
      const out = trap(() => expect(normalize_dash_pattern(pattern)).to.be.equal([]))
      expect(out.warn).to.be.equal(`[bokeh ${version}] invalid line dash pattern: ${pattern.join(",")}\n`)
    }
  })
})
