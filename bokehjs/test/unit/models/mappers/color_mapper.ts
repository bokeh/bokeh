import {expect} from "assertions"

import {_convert_color, _convert_palette} from "@bokehjs/models/mappers/color_mapper"

describe("ColorMapper module", () => {

  it("support _convert_color() function", () => {
    expect(_convert_color("cadetblue")).to.be.equal(0x5f9ea0ff)
    expect(_convert_color("rgb(95,158,160)")).to.be.equal(0x5f9ea0ff)
    expect(_convert_color("#5f9ea0")).to.be.equal(0x5f9ea0ff)
    expect(_convert_color("#5F9EA0")).to.be.equal(0x5f9ea0ff)
  })

  it("support _convert_palette() function", () => {
    const palette = ["red", "green", "blue", "#31a354", "#addd8e", "#F7FCB9"]
    const expected = Uint32Array.of(0xff0000ff, 0x008000ff, 0x0000ffff, 0x31a354ff, 0xaddd8eff, 0xf7fcb9ff)
    expect(_convert_palette(palette)).to.be.equal(expected)
  })
})
