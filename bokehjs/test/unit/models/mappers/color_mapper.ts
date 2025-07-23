import {expect} from "assertions"

import {convert_to_uint32_color, convert_to_uint32_palette} from "@bokehjs/models/mappers/color_mapper"

describe("ColorMapper module", () => {

  it("support convert_to_uint32_color() function", () => {
    expect(convert_to_uint32_color("cadetblue")).to.be.equal(0x5f9ea0ff)
    expect(convert_to_uint32_color("rgb(95,158,160)")).to.be.equal(0x5f9ea0ff)
    expect(convert_to_uint32_color("#5f9ea0")).to.be.equal(0x5f9ea0ff)
    expect(convert_to_uint32_color("#5F9EA0")).to.be.equal(0x5f9ea0ff)
  })

  it("support convert_to_uint32_palette() function", () => {
    const palette = ["red", "green", "blue", "#31a354", "#addd8e", "#F7FCB9"]
    const expected = Uint32Array.of(0xff0000ff, 0x008000ff, 0x0000ffff, 0x31a354ff, 0xaddd8eff, 0xf7fcb9ff)
    expect(convert_to_uint32_palette(palette)).to.be.equal(expected)
  })
})
