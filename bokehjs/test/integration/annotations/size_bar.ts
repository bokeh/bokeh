import {display, fig} from "../_util"

import {SizeBar} from "@bokehjs/models"
import type {Side, Orientation} from "@bokehjs/core/enums"
import type {Size} from "@bokehjs/core/types"
import {Random} from "@bokehjs/core/util/random"

describe("SizeBar annotation", () => {
  function make_plot(size: Size = {width: 300, height: 200}) {
    const random = new Random(1)

    const N = 100
    const x = random.floats(N).map((v) => 100*v)
    const y = random.floats(N).map((v) => 100*v)
    const radii = random.floats(N).map((v) => 10*v)

    const p = fig([size.width, size.height])
    const cr = p.circle({x, y, radius: radii, line_color: "black", fill_alpha: 0.8})

    return {p, cr}
  }

  const common: Partial<SizeBar.Attrs> = {
    title: "SizeBar",
    glyph_fill_color: "pink",
    glyph_line_color: "green",
    border_line_color: "violet",
    border_line_dash: "dotdash",
    bar_line_color: "gray",
    bar_line_dash: "dotted",
  }

  it("should support automatic renderer", async () => {
    const {p} = make_plot()

    const size_bar = new SizeBar({renderer: "auto", orientation: "horizontal", width: "max", ...common})
    p.add_layout(size_bar, "below")

    await display(p)
  })

  it("should support manual renderer", async () => {
    const {p, cr} = make_plot()

    const size_bar = new SizeBar({renderer: cr, orientation: "horizontal", width: "max", ...common})
    p.add_layout(size_bar, "below")

    await display(p)
  })

  async function test(orientation: Orientation, side: Side, width: number, height: number) {
    const {p, cr} = make_plot({width, height})

    const size_bar = new SizeBar({renderer: cr, orientation, ...common})
    p.add_layout(size_bar, side)

    await display(p)
  }

  describe("should support horizontal orientation", () => {
    it("above", async () => test("horizontal", "above", 300, 200))
    it("below", async () => test("horizontal", "below", 300, 200))
    it("left",  async () => test("horizontal", "left",  500, 200))
    it("right", async () => test("horizontal", "right", 500, 200))
  })

  describe("should support vertical orientation", () => {
    it("above", async () => test("vertical", "above", 300, 400))
    it("below", async () => test("vertical", "below", 300, 400))
    it("left",  async () => test("vertical", "left",  300, 200))
    it("right", async () => test("vertical", "right", 300, 200))
  })
})
