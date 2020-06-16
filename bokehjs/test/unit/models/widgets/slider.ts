import {expect} from "assertions"

import {Slider} from "@bokehjs/models/widgets/slider"
import {isInteger} from "@bokehjs/core/util/types"
import {build_view} from "@bokehjs/core/build_views"

describe("SliderView", () => {

  it("_calc_from should return integer if start/end/step all integers", async () => {
    const s = new Slider({start: 0, end: 10, step: 1})
    const sv = (await build_view(s)).build()

    const r = (sv as any /* XXX: protected */)._calc_from([5.0])
    expect(r).to.be.equal(5)
    expect(isInteger(r)).to.be.true
  })
})
