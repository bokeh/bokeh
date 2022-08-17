import {expect} from "../unit/assertions"
import {display, fig, row, grid} from "./_util"

import {Spacer, Tabs, TabPanel, GroupBox, Column} from "@bokehjs/models/layouts"
import {Pane} from "@bokehjs/models/ui"
import {TextInput, Button} from "@bokehjs/models/widgets"
import {SizingPolicy} from "@bokehjs/core/layout"
import {Color} from "@bokehjs/core/types"
import {Location} from "@bokehjs/core/enums"
import {range} from "@bokehjs/core/util/array"
import {Matrix} from "@bokehjs/core/util/matrix"
import {color2css, is_dark, RGBA} from "@bokehjs/core/util/color"
import {figure, gridplot} from "@bokehjs/api/plotting"
import {BasicTickFormatter} from "@bokehjs/models/formatters"

describe("UIElement", () => {
  it("should support dashed, snake and camel CSS property names in styles", async () => {
    const common = {width: "100px", height: "100px"}

    const p0 = new Pane({styles: {...common, "background-color": "red"}})
    const p1 = new Pane({styles: {...common, background_color: "green"}})
    const p2 = new Pane({styles: {...common, backgroundColor: "blue"}})

    const layout = new Pane({styles: {display: "inline-flex"}, children: [p0, p1, p2]})
    await display(layout, [350, 150])
  })
})

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
      styles: {
        background_color: color2css(color),
      },
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

  const viewport: [number, number] = [300, 300]

  it("fixed spacers 50px x 50px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items)
    await display(l, viewport)
  })

  it("fixed spacers 50px x 50px, spacing 5px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {spacing: 5})
    await display(l, viewport)
  })

  it("fixed spacers 50px x 50px, vspacing 5px, hspacing 10px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {spacing: [5, 10]})
    await display(l, viewport)
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
    await display(l, viewport)
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
    await display(l, viewport)
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
    await display(l, viewport)
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
    await display(l, viewport)
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
    await display(l, viewport)
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
    await display(l, viewport)
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
    await display(l, viewport)
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
    await display(l, viewport)
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
      return s0([r, g, b])
    })

    const l = grid(items)
    await display(l, [600, 600])
  })

  it("should allow 10x20 grids of buttons", async () => {
    const ncols = 10
    const nrows = 20

    const items = new Matrix(nrows, ncols, (row, col) => {
      const x = 100.0/ncols*col
      const y = 100.0/nrows*row
      const rgba: RGBA = [Math.floor(50 + 2*x), Math.floor(30 + 2*y), 150, 255]
      return new Button({
        label: `${row},${col}`,
        sizing_mode: "scale_width",
        margin: null,
        stylesheets: [`
          .bk-btn {
            background-color: ${color2css(rgba)};
            color: ${is_dark(rgba) ? "white" : "black"};
            font-size: 75%;
          }
        `],
      })
    })

    const l = grid(items, {spacing: 5})
    await display(l, [700, 700])
  })
})

describe("Tabs", () => {
  const panel = (color: string) => {
    const p = fig([100, 100])
    p.circle([0, 5, 10], [0, 5, 10], {size: 5, color})
    return new TabPanel({title: color, child: p})
  }

  const tabs = (tabs_location: Location, tabs: string[]) => {
    return new Tabs({tabs: tabs.map(panel), tabs_location})
  }

  it("should allow tabs header location above", async () => {
    const obj = tabs("above", ["red", "green", "blue"])
    await display(obj, [200, 150])
  })

  it("should allow tabs header location below", async () => {
    const obj = tabs("below", ["red", "green", "blue"])
    await display(obj, [200, 150])
  })

  it("should allow tabs header location left", async () => {
    const obj = tabs("left", ["red", "green", "blue"])
    await display(obj, [200, 150])
  })

  it("should allow tabs header location right", async () => {
    const obj = tabs("right", ["red", "green", "blue"])
    await display(obj, [200, 150])
  })

  it("should allow tabs header location above with active == 1", async () => {
    const obj = tabs("above", ["red", "green", "blue"])
    obj.active = 1
    await display(obj, [200, 150])
  })

  it("should allow tabs header location below with active == 1", async () => {
    const obj = tabs("below", ["red", "green", "blue"])
    obj.active = 1
    await display(obj, [200, 150])
  })

  it("should allow tabs header location left with active == 1", async () => {
    const obj = tabs("left", ["red", "green", "blue"])
    obj.active = 1
    await display(obj, [200, 150])
  })

  it("should allow tabs header location right with active == 1", async () => {
    const obj = tabs("right", ["red", "green", "blue"])
    obj.active = 1
    await display(obj, [200, 150])
  })

  it("should allow tabs header location above with overflow", async () => {
    const obj = tabs("above", ["red", "green", "blue", "cyan", "magenta"])
    await display(obj, [200, 150])
  })

  it("should allow tabs header location below with overflow", async () => {
    const obj = tabs("below", ["red", "green", "blue", "cyan", "magenta"])
    await display(obj, [200, 150])
  })

  it("should allow tabs header location left with overflow", async () => {
    const obj = tabs("left", ["red", "green", "blue", "cyan", "magenta"])
    await display(obj, [200, 150])
  })

  it("should allow tabs header location right with overflow", async () => {
    const obj = tabs("right", ["red", "green", "blue", "cyan", "magenta"])
    await display(obj, [200, 150])
  })

  it("should allow tabs header location above with overflow and active off-screen", async () => {
    const obj = tabs("above", ["red", "green", "blue", "cyan", "magenta"])
    obj.active = 3
    await display(obj, [200, 150])
  })

  it("should allow tabs header location below with overflow and active off-screen", async () => {
    const obj = tabs("below", ["red", "green", "blue", "cyan", "magenta"])
    obj.active = 3
    await display(obj, [200, 150])
  })

  it("should allow tabs header location left with overflow and active off-screen", async () => {
    const obj = tabs("left", ["red", "green", "blue", "cyan", "magenta"])
    obj.active = 3
    await display(obj, [200, 150])
  })

  it("should allow tabs header location right with overflow and active off-screen", async () => {
    const obj = tabs("right", ["red", "green", "blue", "cyan", "magenta"])
    obj.active = 3
    await display(obj, [200, 150])
  })

  it("should allow tabs header location above with disabled=true", async () => {
    const obj = tabs("above", ["red", "green", "blue"])
    obj.disabled = true
    await display(obj, [200, 150])
  })

  it("should allow tabs header location below with disabled=true", async () => {
    const obj = tabs("below", ["red", "green", "blue"])
    obj.disabled = true
    await display(obj, [200, 150])
  })

  it("should allow tabs header location left with disabled=true", async () => {
    const obj = tabs("left", ["red", "green", "blue"])
    obj.disabled = true
    await display(obj, [200, 150])
  })

  it("should allow tabs header location right with disabled=true", async () => {
    const obj = tabs("right", ["red", "green", "blue"])
    obj.disabled = true
    await display(obj, [200, 150])
  })

  it("should allow tabs header location above with second tab disabled", async () => {
    const obj = tabs("above", ["red", "green", "blue"])
    obj.tabs[1].disabled = true
    await display(obj, [200, 150])
  })

  it("should allow tabs header location below with second tab disabled", async () => {
    const obj = tabs("below", ["red", "green", "blue"])
    obj.tabs[1].disabled = true
    await display(obj, [200, 150])
  })

  it("should allow tabs header location left with second tab disabled", async () => {
    const obj = tabs("left", ["red", "green", "blue"])
    obj.tabs[1].disabled = true
    await display(obj, [200, 150])
  })

  it("should allow tabs header location right with second tab disabled", async () => {
    const obj = tabs("right", ["red", "green", "blue"])
    obj.tabs[1].disabled = true
    await display(obj, [200, 150])
  })
})

describe("gridplot()", () => {
  const layout = (toolbar_location: Location | null) => {
    const coeffs = [10**3, 10**6, 10**9]
    const values = (c: number) => range(10).map((v) => c*v)

    const figs = coeffs.map((ycoeff) => {
      return coeffs.map((xcoeff) => {
        const fig = figure({height: 200, width: 200})
        fig.xaxis.each((axis) => (axis.formatter as BasicTickFormatter).use_scientific = false)
        fig.yaxis.each((axis) => (axis.formatter as BasicTickFormatter).use_scientific = false)
        fig.xaxis.major_label_orientation = "vertical"
        fig.yaxis.major_label_orientation = "horizontal"
        fig.circle(values(xcoeff), values(ycoeff), {size: 5})
        return fig
      })
    })

    return gridplot(figs, {toolbar_location})
  }

  it("should align axes when toolbar_location=null", async () => {
    const {view} = await display(layout(null))
    expect(() => view.export()).to.not.throw()
  })

  it("should align axes when toolbar_location=above", async () => {
    const {view} = await display(layout("above"))
    expect(() => view.export()).to.not.throw()
  })

  it("should align axes when toolbar_location=right", async () => {
    const {view} = await display(layout("right"))
    expect(() => view.export()).to.not.throw()
  })

  it("should align axes when toolbar_location=left", async () => {
    const {view} = await display(layout("left"))
    expect(() => view.export()).to.not.throw()
  })

  it("should align axes when toolbar_location=below", async () => {
    const {view} = await display(layout("below"))
    expect(() => view.export()).to.not.throw()
  })
})

describe("GroupBox", () => {
  it.allowing(3*8)("should allow multiple TextInput widgets", async () => {
    const group_box = new GroupBox({
      title: "Head offset:",
      checkable: true,
      child: new Column({
        children: [
          new TextInput({placeholder: "Enter value ...", prefix: "X", suffix: "mm"}),
          new TextInput({placeholder: "Enter value ...", prefix: "Y", suffix: "mm"}),
          new TextInput({placeholder: "Enter value ...", prefix: "Z", suffix: "mm"}),
        ],
      }),
    })
    await display(group_box, [400, 200])
  })
})
