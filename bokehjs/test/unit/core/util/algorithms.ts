import {expect} from "assertions"

import {qbb, cbb} from "@bokehjs/core/util/algorithms"

describe("core/util/algorithms", () => {
  it("should support qbb() function", () => {
    expect(qbb(0, 0,  1,  0, 2, 0)).to.be.similar({x0:  0.0, x1: 2.0, y0:  0.0, y1: 0.0})
    expect(qbb(0, 0,  0,  1, 0, 2)).to.be.similar({x0:  0.0, x1: 0.0, y0:  0.0, y1: 2.0})
    expect(qbb(0, 0,  1,  2, 2, 0)).to.be.similar({x0:  0.0, x1: 2.0, y0:  0.0, y1: 1.0})
    expect(qbb(0, 0,  1, -2, 2, 0)).to.be.similar({x0:  0.0, x1: 2.0, y0: -1.0, y1: 0.0})
    expect(qbb(0, 0, -1,  2, 2, 1)).to.be.similar({x0: -1/4, x1: 2.0, y0:  0.0, y1: 4/3})
  })

  it("should support cbb() function", () => {
    expect(cbb(0, 0, 1,  0, 2,  0, 3, 0)).to.be.similar({x0: 0.0, x1: 3.0, y0:  0.0, y1: 0.0})
    expect(cbb(0, 0, 0,  1, 0,  2, 0, 3)).to.be.similar({x0: 0.0, x1: 0.0, y0:  0.0, y1: 3.0})
    expect(cbb(0, 0, 0,  2, 3,  2, 3, 0)).to.be.similar({x0: 0.0, x1: 3.0, y0:  0.0, y1: 1.5})
    expect(cbb(0, 0, 0, -2, 3, -2, 3, 0)).to.be.similar({x0: 0.0, x1: 3.0, y0: -1.5, y1: 0.0})
  })
})
