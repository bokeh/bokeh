import {expect} from "assertions"

import {SpatialIndex} from "@bokehjs/core/util/spatial"
import * as bbox from "@bokehjs/core/util/bbox"

describe("core/util/spatial module", () => {

  it("support SpatialIndex.bounds() with an empty index", () => {
    const index = new SpatialIndex(0)
    index.finish()
    expect(index.bounds(bbox.empty())).to.be.equal(bbox.empty())
    expect(index.bounds(bbox.full())).to.be.equal(bbox.empty())
    expect(index.bounds(bbox.positive_x())).to.be.equal(bbox.empty())
    expect(index.bounds(bbox.positive_y())).to.be.equal(bbox.empty())
    expect(index.bounds(bbox.negative_x())).to.be.equal(bbox.empty())
    expect(index.bounds(bbox.negative_y())).to.be.equal(bbox.empty())
    expect(index.bounds(bbox.x_range(-1.5, 2.8))).to.be.equal(bbox.empty())
    expect(index.bounds(bbox.y_range(-1.5, 2.8))).to.be.equal(bbox.empty())
    expect(index.bounds({x0: -10, y0: 2.3, x1: 1000.2, y1: 100})).to.be.equal(bbox.empty())
  })

  it("support SpatialIndex.bounds() with full rect", () => {
    const index = new SpatialIndex(6)
    index.add_rect(0, 1, 1, 2)
    index.add_rect(0.0001, 1, 1, 2)
    index.add_rect(0, 100, 1, 200)
    index.add_rect(0.0001, -100, 1, 200)
    index.add_rect(0, 10, 1, 20)
    index.add_rect(-0.0001, 10, 1, 20)
    index.finish()
    expect(index.bounds(bbox.full())).to.be.equal({x0: -0.0001, x1: 1, y0: -100, y1: 200})
  })

  // it("support SpatialIndex.bounds() with empty rect", () => {
  //   const index = new SpatialIndex(6)
  //   index.add_rect(0, 1, 1, 2)
  //   index.add_rect(0.0001, 1, 1, 2)
  //   index.add_rect(0, 100, 1, 200)
  //   index.add_rect(0.0001, -100, 1, 200)
  //   index.add_rect(0, 10, 1, 20)
  //   index.add_rect(-0.0001, 10, 1, 20)
  //   index.finish()
  //   expect(index.bounds(bbox.empty())).to.be.equal(bbox.empty())
  // })

  it("support SpatialIndex.bounds() with postive_x rect", () => {
    const index = new SpatialIndex(6)
    index.add_rect(0, 1, 1, 2)
    index.add_rect(0.0001, 1, 1, 2)
    index.add_rect(0, 100, 1, 200)
    index.add_rect(0.0001, 100, 1, 200)
    index.add_rect(0, 10, 1, 20)
    index.add_rect(-0.0001, 10, 1, 20)
    index.finish()
    expect(index.bounds(bbox.positive_x())).to.be.equal({x0: 0.0001, x1: 1, y0: 1, y1: 200})
  })

  it("support SpatialIndex.bounds() with negative_x rect", () => {
    const index = new SpatialIndex(6)
    index.add_rect(0, 1, 1, 2)
    index.add_rect(0.0001, 1, 1, 2)
    index.add_rect(0, 100, 1, 200)
    index.add_rect(0.0001, 100, 1, 200)
    index.add_rect(0, 10, 1, 20)
    index.add_rect(-1, 10, -0.0001, 20)
    index.finish()
    expect(index.bounds(bbox.negative_x())).to.be.equal({x0: -1, x1: -0.0001, y0: 10, y1: 20})
  })

  it("support SpatialIndex.bounds() with postive_y rect", () => {
    const index = new SpatialIndex(6)
    index.add_rect(0, 1, 1, 2)
    index.add_rect(0.0001, 1, 1, 2)
    index.add_rect(0, 100, 1, 200)
    index.add_rect(0.0001, 100, 1, 200)
    index.add_rect(0, 10, 1, 20)
    index.add_rect(-0.0001, 10, 1, 20)
    index.finish()
    expect(index.bounds(bbox.positive_y())).to.be.equal({x0: -0.0001, x1: 1, y0: 1, y1: 200})
  })

  it("support SpatialIndex.bounds() with negative_y rect", () => {
    const index = new SpatialIndex(6)
    index.add_rect(0, 1, 1, 2)
    index.add_rect(0.0001, 1, 1, 2)
    index.add_rect(0, 100, 1, 200)
    index.add_rect(0.0001, 100, 1, 200)
    index.add_rect(0, 10, 1, 20)
    index.add_rect(-0.0001, -10, 1, -2)
    index.finish()
    expect(index.bounds(bbox.negative_y())).to.be.equal({x0: -0.0001, x1: 1, y0: -10, y1: -2})
  })

  it("support SpatialIndex.bounds() with x_range rect", () => {
    const index = new SpatialIndex(6)
    index.add_rect(0, 1, 1, 2)
    index.add_rect(1, 1, 2, 2)
    index.add_rect(0, 100, 1, 200)
    index.add_rect(0.2, 100, 1, 200)
    index.add_rect(4, 10, 5, 20)
    index.add_rect(-0.1, -10, 0.5, -2)
    index.finish()
    expect(index.bounds(bbox.x_range(1, 3))).to.be.equal({x0: 1, x1: 2, y0: 1, y1: 200})
    expect(index.bounds(bbox.x_range(1000, 2000))).to.be.equal(bbox.empty())
    expect(index.bounds(bbox.x_range(-2000, -1000))).to.be.equal(bbox.empty())
  })

  it("support SpatialIndex.bounds() with y_range rect", () => {
    const index = new SpatialIndex(6)
    index.add_rect(0, 1, 1, 2)
    index.add_rect(1, 1, 2, 2)
    index.add_rect(0, 100, 1, 200)
    index.add_rect(0.2, 100, 1, 200)
    index.add_rect(4, 10, 5, 20)
    index.add_rect(-0.1, -10, 0.5, -2)
    index.finish()
    expect(index.bounds(bbox.y_range(-10, 3))).to.be.equal({x0: -0.1, x1: 2, y0: -10, y1: 2})
    expect(index.bounds(bbox.y_range(1000, 2000))).to.be.equal(bbox.empty())
    expect(index.bounds(bbox.y_range(-2000, -1000))).to.be.equal(bbox.empty())
  })

})
