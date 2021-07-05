import {expect} from "assertions"

import {SpatialIndex} from "@bokehjs/core/util/spatial"
import * as bbox from "@bokehjs/core/util/bbox"

describe("core/util/spatial module", () => {
  it("support SpatialIndex.bounds()", () => {
    const ndx = new SpatialIndex(3)
    ndx.add(0, 1, 1, 2)
    ndx.add(0, 100, 1, 200)
    ndx.add(0, 10, 1, 20)
    ndx.finish()
    expect(ndx.bounds(bbox.positive_x())).to.be.equal({x0: 0, x1: 1, y0: 1, y1: 200})
    expect(ndx.bounds(bbox.positive_y())).to.be.equal({x0: 0, x1: 1, y0: 1, y1: 200})
  })
})
