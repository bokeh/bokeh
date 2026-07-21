import {expect} from "#framework/assertions"

import {area_path, stepped_area_path} from "@bokehjs/models/glyphs/area"

describe("area screen geometry", () => {
  it("should close a finite area run", () => {
    const {sx, sy} = area_path([0, 1], [0, 0], [0, 1], [1, 1])
    expect(sx).to.be.equal(Float32Array.of(0, 1, 1, 0, 0))
    expect(sy).to.be.equal(Float32Array.of(0, 0, 1, 1, 0))
  })

  it("should split disjoint finite runs", () => {
    const {sx, sy} = area_path(
      [0, 1, NaN, 3, 4], [0, 0, NaN, 0, 0],
      [0, 1, NaN, 3, 4], [1, 1, NaN, 1, 1],
    )
    expect(sx.length).to.be.equal(11)
    expect(sy.length).to.be.equal(11)
    expect(Number.isNaN(sx[5])).to.be.true
    expect(Number.isNaN(sy[5])).to.be.true
    expect(sx[0]).to.be.equal(sx[4])
    expect(sy[0]).to.be.equal(sy[4])
    expect(sx[6]).to.be.equal(sx[10])
    expect(sy[6]).to.be.equal(sy[10])
  })

  it("should construct closed stepped areas for both orientations", () => {
    for (const axis of ["x", "y"] as const) {
      for (const mode of ["before", "center", "after"] as const) {
        const {sx, sy} = stepped_area_path(
          [0, 1, 2], [0, 1, 0], [0, 1, 2], [2, 3, 2], mode, axis,
        )
        expect(sx.length).to.be.equal(sy.length)
        expect(sx.length >= 9).to.be.true
        expect(sx[0]).to.be.equal(sx[sx.length - 1])
        expect(sy[0]).to.be.equal(sy[sy.length - 1])
      }
    }
  })
})
