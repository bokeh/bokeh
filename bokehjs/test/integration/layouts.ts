import {display, fig, row, column, grid} from "./utils"

import {Spacer, Tabs, Panel} from "@bokehjs/models/layouts"
import {ToolbarBox} from "@bokehjs/models/tools/toolbar_box"
import {SizingPolicy} from "@bokehjs/core/layout"
import {Color} from "@bokehjs/core/types"
import {Location} from "@bokehjs/core/enums"
import {range} from "@bokehjs/core/util/array"
import {Matrix} from "@bokehjs/core/util/data_structures"
import {figure, gridplot, color} from "@bokehjs/api/plotting"

const spacer =
  (width_policy: SizingPolicy, height_policy: SizingPolicy,
   width: number | null, height: number | null,
   min_width?: number, min_height?: number,
   max_width?: number, max_height?: number) => (color: Color): Spacer => {
    return new Spacer({
      width_policy, height_policy,
      width, height,
      min_width, min_height,
      max_width, max_height,
      background: color,
    })
  }

describe("Row", () => {
  it("should allow to expand when child policy is max", async () => {
    const s0 = spacer("max", "fixed", null, 40)("red")
    const s1 = spacer("min", "fixed", 120, 30)("green")

    const l = row([s0, s1])
    await display(l, [300, 300])
  })

  /* XXX: fix "max" column policy
  it("should allow to expand when column policy is max", async () => {
    const s0 = spacer("fixed", "fixed", 80, 40)("red")
    const s1 = spacer("fixed", "fixed", 120, 30)("green")

    const l = row([s0, s1], {cols: {0: "max", 1: "min"}})
    await display(l, [300, 300])
  })
  */
})

describe("3x3 GridBox", () => {
  const colors = Matrix.from([
    ["red",  "green",  "blue"   ],
    ["gray", "orange", "fuchsia"],
    ["aqua", "maroon", "yellow" ],
  ])

  it("fixed spacers 50px x 50px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items)
    await display(l, [300, 300])
  })

  it("fixed spacers 50px x 50px, spacing 5px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {spacing: 5})
    await display(l, [300, 300])
  })

  it("fixed spacers 50px x 50px, vspacing 5px, hspacing 10px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {spacing: [5, 10]})
    await display(l, [300, 300])
  })

  it("fixed and 1 x-max spacers, c2 auto", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)
    const s1 = spacer("max", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s1],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {cols: {2: {policy: "auto"}}})
    await display(l, [300, 300])
  })

  it("fixed and 2 x-max spacers, c2 auto", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)
    const s1 = spacer("max", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s1, s1],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {cols: {2: {policy: "auto"}}})
    await display(l, [300, 300])
  })

  it("fixed and 2 x-max spacers, c2 flex=2", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)
    const s1 = spacer("max", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s1, s1],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {cols: {2: {policy: "max", flex: 2}}})
    await display(l, [300, 300])
  })

  it("fixed and 3 x-max spacers, c2 flex=2", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)
    const s1 = spacer("max", "fixed", 50, 50)

    const items = colors.apply([
      [s1, s1, s1],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {cols: {2: {policy: "max", flex: 2}}})
    await display(l, [300, 300])
  })

  it("fixed and 3 x-max spacers, c2 flex=2 align=end", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)
    const s1 = spacer("max", "fixed", 50, 50)

    const items = colors.apply([
      [s1, s1, s1],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {cols: {2: {policy: "max", flex: 2, align: "end"}}})
    await display(l, [300, 300])
  })

  it("fixed, inconsistent width/height, row/col auto align=start", async () => {
    const s = (width: number, height: number) => spacer("fixed", "fixed", width, height)

    const items = colors.apply([
      [s(60, 30), s(30, 60), s(90, 90)],
      [s(30, 60), s(90, 30), s(30, 90)],
      [s(90, 90), s(60, 90), s(60, 30)],
    ])

    const l = grid(items, {
      rows: {"*": {policy: "auto", align: "start"}},
      cols: {"*": {policy: "auto", align: "start"}},
    })
    await display(l, [300, 300])
  })

  it("fixed, inconsistent width/height, row/col auto align=center", async () => {
    const s = (width: number, height: number) => spacer("fixed", "fixed", width, height)

    const items = colors.apply([
      [s(60, 30), s(30, 60), s(90, 90)],
      [s(30, 60), s(90, 30), s(30, 90)],
      [s(90, 90), s(60, 90), s(60, 30)],
    ])

    const l = grid(items, {
      rows: {"*": {policy: "auto", align: "center"}},
      cols: {"*": {policy: "auto", align: "center"}},
    })
    await display(l, [300, 300])
  })

  it("fixed, inconsistent width/height, row/col auto align=end", async () => {
    const s = (width: number, height: number) => spacer("fixed", "fixed", width, height)

    const items = colors.apply([
      [s(60, 30), s(30, 60), s(90, 90)],
      [s(30, 60), s(90, 30), s(30, 90)],
      [s(90, 90), s(60, 90), s(60, 30)],
    ])

    const l = grid(items, {
      rows: {"*": {policy: "auto", align: "end"}},
      cols: {"*": {policy: "auto", align: "end"}},
    })
    await display(l, [300, 300])
  })
})

describe("GridBox", () => {
  it("should allow 20x20 grids of 25x25 px spacers", async () => {
    const s0 = spacer("fixed", "fixed", 25, 25)

    const ncols = 20
    const nrows = 20

    const items = new Matrix(nrows, ncols, (row, col) => {
      const x = 100.0/ncols*col
      const y = 100.0/nrows*row
      const [r, g, b] = [Math.floor(50 + 2*x), Math.floor(30 + 2*y), 150]
      return s0(color(r, g, b))
    })

    const l = grid(items)
    await display(l, [600, 600])
  })
})

describe("Tabs", () => {
  const panel = (color: string) => {
    const p = fig([200, 200])
    p.circle([0, 5, 10], [0, 5, 10], {size: 10, color})
    return new Panel({title: color, child: p})
  }

  const tabs = (tabs_location: Location) => {
    return new Tabs({tabs: ["red", "green", "blue"].map(panel), tabs_location})
  }

  it("should allow tabs header location above", async () => {
    const obj = tabs("above")
    await display(obj, [300, 300])
  })

  it("should allow tabs header location below", async () => {
    const obj = tabs("below")
    await display(obj, [300, 300])
  })

  it("should allow tabs header location left", async () => {
    const obj = tabs("left")
    await display(obj, [300, 300])
  })

  it("should allow tabs header location right", async () => {
    const obj = tabs("right")
    await display(obj, [300, 300])
  })
})

describe("gridplot()", () => {
  const layout = (toolbar_location: Location | null) => {
    const coeffs = [10**3, 10**6, 10**9]
    const values = (c: number) => range(10).map((v) => c*v)

    const figs = coeffs.map((ycoeff) => {
      return coeffs.map((xcoeff) => {
        const fig = figure({plot_height: 200, plot_width: 200})
        fig.xaxis.map((axis) => (axis.formatter as any).use_scientific = false)
        fig.yaxis.map((axis) => (axis.formatter as any).use_scientific = false)
        fig.xaxis.map((axis) => axis.major_label_orientation = "vertical")
        fig.yaxis.map((axis) => axis.major_label_orientation = "horizontal")
        fig.circle(values(xcoeff), values(ycoeff), {size: 5})
        return fig
      })
    })

    return gridplot(figs, {toolbar_location})
  }

  it("should align axes when toolbar_location=null", async () => {
    await display(layout(null), [800, 800])
  })

  it("should align axes when toolbar_location=above", async () => {
    await display(layout("above"), [800, 800])
  })

  it("should align axes when toolbar_location=right", async () => {
    await display(layout("right"), [800, 800])
  })

  it("should align axes when toolbar_location=left", async () => {
    await display(layout("left"), [800, 800])
  })

  it("should align axes when toolbar_location=below", async () => {
    await display(layout("below"), [800, 800])
  })
})

describe("ToolbarBox", () => {
  const fig = (width: number = 100, height: number = 100) => {
    const p = figure({width, height, tools: "pan,reset,help", toolbar_location: null})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    return p
  }

  function tb_above() {
    const p = fig(250, 250)
    const tb = new ToolbarBox({toolbar: p.toolbar, toolbar_location: "above"})
    return column([tb, p])
  }

  function tb_below() {
    const p = fig(250, 250)
    const tb = new ToolbarBox({toolbar: p.toolbar, toolbar_location: "below"})
    return column([p, tb])
  }

  function tb_left() {
    const p = fig(250, 250)
    const tb = new ToolbarBox({toolbar: p.toolbar, toolbar_location: "left"})
    return row([tb, p])
  }

  function tb_right() {
    const p = fig(250, 250)
    const tb = new ToolbarBox({toolbar: p.toolbar, toolbar_location: "right"})
    return row([p, tb])
  }

  it("should allow placement above a figure", async () => {
    await display(tb_above(), [300, 300])
  })

  it("should allow placement below a figure", async () => {
    await display(tb_below(), [300, 300])
  })

  it("should allow placement left of a figure", async () => {
    await display(tb_left(),  [300, 300])
  })

  it("should allow placement right of a figure", async () => {
    await display(tb_right(), [300, 300])
  })
})
