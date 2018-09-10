import {expect} from "chai"

import {Slider} from "models/widgets/slider"
import {isInteger} from "core/util/types"

describe("SliderView", () => {

  it("_calc_from should return integer if start/end/step all integers", () => {
    const s = new Slider({start: 0, end: 10, step: 1})
    const sv = new s.default_view({model: s, parent: null}).build() as any // XXX: default_view

    const r = sv._calc_from([5.0])
    expect(r).to.be.equal(5)
    expect(isInteger(r)).to.be.true
  })
})
