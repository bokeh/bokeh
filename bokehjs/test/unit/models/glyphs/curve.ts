import {expect} from "#framework/assertions"

import {arc_sweep, cubic_curve, elliptical_arc, quadratic_curve} from "@bokehjs/models/glyphs/curve"

describe("glyph curve geometry", () => {
  const {PI} = Math

  it("should follow Canvas arc direction semantics", () => {
    expect(arc_sweep(0, PI/2, false)).to.be.equal(PI/2)
    expect(arc_sweep(0, PI/2, true)).to.be.equal(-3*PI/2)
    expect(arc_sweep(0, 2*PI, false)).to.be.equal(2*PI)
    expect(arc_sweep(0, 2*PI, true)).to.be.equal(-2*PI)
    expect(arc_sweep(1, 1, false)).to.be.equal(0)
  })

  it("should adaptively flatten quadratic curves", () => {
    const straight = quadratic_curve([0, 0], [5, 0], [10, 0])
    expect(straight.sx).to.be.equal(Float32Array.of(0, 10))
    expect(straight.sy).to.be.equal(Float32Array.of(0, 0))

    const curved = quadratic_curve([0, 0], [5, 10], [10, 0])
    expect(curved.sx.length > straight.sx.length).to.be.true
    expect(curved.sx[0]).to.be.equal(0)
    expect(curved.sy[0]).to.be.equal(0)
    expect(curved.sx[curved.sx.length - 1]).to.be.equal(10)
    expect(curved.sy[curved.sy.length - 1]).to.be.equal(0)
  })

  it("should adaptively flatten cubic curves", () => {
    const straight = cubic_curve([0, 0], [2, 0], [8, 0], [10, 0])
    expect(straight.sx).to.be.equal(Float32Array.of(0, 10))

    const curved = cubic_curve([0, 0], [0, 10], [10, 10], [10, 0])
    expect(curved.sx.length > straight.sx.length).to.be.true
    expect(curved.sx[0]).to.be.equal(0)
    expect(curved.sy[0]).to.be.equal(0)
    expect(curved.sx[curved.sx.length - 1]).to.be.equal(10)
    expect(curved.sy[curved.sy.length - 1]).to.be.equal(0)
  })

  it("should flatten rotated ellipses to subpixel tolerance", () => {
    const small = elliptical_arc([10, 20], 2, 1, PI/2, 0, 2*PI, false)
    const large = elliptical_arc([10, 20], 200, 100, PI/2, 0, 2*PI, false)

    expect(large.sx.length > small.sx.length).to.be.true
    expect(Math.abs(small.sx[0] - 10) < 1e-5).to.be.true
    expect(Math.abs(small.sy[0] - 22) < 1e-5).to.be.true
    expect(small.sx[small.sx.length - 1]).to.be.equal(small.sx[0])
    expect(small.sy[small.sy.length - 1]).to.be.equal(small.sy[0])
  })

  it("should reject non-finite ellipses", () => {
    const line = elliptical_arc([NaN, 0], 10, 5, 0, 0, PI, false)
    expect(line.sx.length).to.be.equal(0)
    expect(line.sy.length).to.be.equal(0)
  })
})
