import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {normalize_dash_pattern} from "@bokehjs/models/glyphs/webgl/dash_cache"

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

  it("should reject negative and non-finite lengths", () => {
    expect(() => normalize_dash_pattern([2, -1])).to.throw()
    expect(() => normalize_dash_pattern([2, NaN])).to.throw()
    expect(() => normalize_dash_pattern([2, Infinity])).to.throw()
  })

  it("should render an all-zero Patch dash pattern without hanging", async () => {
    const p = fig([200, 200], {output_backend: "webgl"})
    p.patch([0, 1, 1, 0], [0, 0, 1, 1], {
      fill_color: null,
      line_color: "navy",
      line_width: 4,
      line_dash: [0, 0],
    })

    await display(p)
  })

  it("should render vectorized all-zero Patches dash patterns without hanging", async () => {
    const p = fig([200, 200], {output_backend: "webgl"})
    p.patches({
      xs: [[0, 1, 1, 0], [2, 3, 3, 2]],
      ys: [[0, 0, 1, 1], [0, 0, 1, 1]],
      fill_color: null,
      line_color: ["navy", "firebrick"],
      line_width: 4,
      line_dash: [[0, 0], [0]],
    })

    await display(p)
  })
})
