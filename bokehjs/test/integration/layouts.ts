import {expect} from "../unit/assertions"
import {display, fig} from "./_util"
import {mouse_click} from "../interactive"

import {Spacer, Tabs, TabPanel, GridBox, GroupBox, ScrollBox, Row, Column, HBox, VBox} from "@bokehjs/models/layouts"
import {TextInput, Button} from "@bokehjs/models/widgets"
import type {SizingPolicy} from "@bokehjs/core/layout"
import type {Color} from "@bokehjs/core/types"
import type {Location} from "@bokehjs/core/enums"
import {range} from "@bokehjs/core/util/array"
import {Matrix} from "@bokehjs/core/util/matrix"
import type {RGBA} from "@bokehjs/core/util/color"
import {color2css, is_dark} from "@bokehjs/core/util/color"
import {figure, gridplot} from "@bokehjs/api/plotting"
import type {BasicTickFormatter, Plot} from "@bokehjs/models"
import {LinearAxis} from "@bokehjs/models"

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
  it("should allow to expand horizontally when width policy is 'max'", async () => {
    const s0 = spacer("max", "fixed", null, 40)(["red", 0.5])
    const s1 = spacer("fixed", "fixed", 60, 30)(["green", 0.5])

    const row = new Row({
      children: [s0, s1],
      width_policy: "max",
      styles: {background_color: "orange"},
    })
    await display(row, [200, 100])
  })
})

describe("Column", () => {
  it("should allow to expand vertically when height policy is 'max'", async () => {
    const s0 = spacer("fixed", "max", 40, null)(["red", 0.5])
    const s1 = spacer("fixed", "fixed", 30, 60)(["green", 0.5])

    const col = new Column({
      children: [s0, s1],
      height_policy: "max",
      styles: {background_color: "orange"},
    })
    await display(col, [100, 200])
  })
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

    const grid = new GridBox({
      children: items.to_sparse(),
    })
    await display(grid, viewport)
  })

  it("fixed spacers 50px x 50px, spacing 5px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const grid = new GridBox({
      children: items.to_sparse(),
      spacing: 5,
    })
    await display(grid, viewport)
  })

  it("fixed spacers 50px x 50px, vspacing 5px, hspacing 10px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const grid = new GridBox({
      children: items.to_sparse(),
      spacing: [5, 10],
    })
    await display(grid, viewport)
  })

  /*
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
  */

  it("fixed and 3 x-max spacers, c2 size=100px and align=end", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)
    const s1 = spacer("max", "fixed", 50, 50)

    const items = colors.apply([
      [s1, s1, s1],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const grid = new GridBox({
      children: items.to_sparse(),
      cols: new Map([
        [2, {size: "100px", align: "end"}],
      ]),
    })
    await display(grid, viewport)
  })

  it("fixed, inconsistent width/height, row/col auto align=start", async () => {
    const s = (width: number, height: number) => spacer("fixed", "fixed", width, height)

    const items = colors.apply([
      [s(60, 30), s(30, 60), s(90, 90)],
      [s(30, 60), s(90, 30), s(30, 90)],
      [s(90, 90), s(60, 90), s(60, 30)],
    ])

    const grid = new GridBox({
      children: items.to_sparse(),
      rows: {align: "start"},
      cols: {align: "start"},
    })
    await display(grid, viewport)
  })

  it("fixed, inconsistent width/height, row/col auto align=center", async () => {
    const s = (width: number, height: number) => spacer("fixed", "fixed", width, height)

    const items = colors.apply([
      [s(60, 30), s(30, 60), s(90, 90)],
      [s(30, 60), s(90, 30), s(30, 90)],
      [s(90, 90), s(60, 90), s(60, 30)],
    ])

    const grid = new GridBox({
      children: items.to_sparse(),
      rows: {align: "center"},
      cols: {align: "center"},
    })
    await display(grid, viewport)
  })

  it("fixed, inconsistent width/height, row/col auto align=end", async () => {
    const s = (width: number, height: number) => spacer("fixed", "fixed", width, height)

    const items = colors.apply([
      [s(60, 30), s(30, 60), s(90, 90)],
      [s(30, 60), s(90, 30), s(30, 90)],
      [s(90, 90), s(60, 90), s(60, 30)],
    ])

    const grid = new GridBox({
      children: items.to_sparse(),
      rows: {align: "end"},
      cols: {align: "end"},
    })
    await display(grid, viewport)
  })
})

const s = (color: Color) => new Spacer({
  sizing_mode: "fixed",
  width: 100,
  height: 100,
  styles: {background_color: color2css(color)},
})

function plot(a: number, b: number, color: Color, plot_args?: Partial<Plot.Attrs>) {
  const p = fig([200, 200], plot_args)
  p.add_layout(new LinearAxis(), "above")
  p.add_layout(new LinearAxis(), "right")
  p.xaxis.each((axis) => (axis.formatter as BasicTickFormatter).use_scientific = false)
  p.yaxis.each((axis) => (axis.formatter as BasicTickFormatter).use_scientific = false)
  p.xaxis.major_label_orientation = "vertical"
  p.yaxis.major_label_orientation = "horizontal"
  const xs = [1, 2, 3].map((c) => c*a)
  const ys = [1, 2, 3].map((c) => c*b)
  p.scatter(xs, ys, {size: 10, color})
  return p
}

describe("FlexBox", () => {
  describe("should support Row layout", () => {
    it("with 3 spacers of 100x100 size", async () => {
      const row = new Row({
        children: [s("red"), s("green"), s("blue")],
      })

      await display(row, [350, 150])
    })

    it("with 3 plots of 200x200 size", async () => {
      const row = new Row({
        children: [
          plot(10**0, 10**0, "red"),
          plot(10**2, 10**2, "green"),
          plot(10**4, 10**4, "blue"),
        ],
      })

      await display(row, [650, 250])
    })
  })

  describe("should support Column layout", () => {
    it("with 3 spacers of 100x100 size", async () => {
      const row = new Column({
        children: [s("red"), s("green"), s("blue")],
      })

      await display(row, [150, 350])
    })

    it("with 3 plots of 200x200 size", async () => {
      const row = new Column({
        children: [
          plot(10**0, 10**0, "red"),
          plot(10**2, 10**2, "green"),
          plot(10**4, 10**4, "blue"),
        ],
      })

      await display(row, [250, 650])
    })
  })
})

describe("HBox", () => {
  it("should allow 3 spacers of 100x100 size", async () => {
    const row = new HBox({
      children: [
        {child: s("red")},
        {child: s("green")},
        {child: s("blue")},
      ],
    })

    await display(row, [350, 150])
  })

  it("should allow 3 plots of 200x200 size", async () => {
    const row = new HBox({
      children: [
        {child: plot(10**0, 10**0, "red")},
        {child: plot(10**2, 10**2, "green")},
        {child: plot(10**4, 10**4, "blue")},
      ],
    })

    await display(row, [650, 250])
  })

  it("should allow to expand horizontally when width policy is 'max'", async () => {
    const s0 = spacer("max", "fixed", null, 40)(["red", 0.5])
    const s1 = spacer("fixed", "fixed", 60, 30)(["green", 0.5])

    const row = new HBox({
      children: [{child: s0}, {child: s1}],
      width_policy: "max",
      styles: {background_color: "orange"},
    })
    await display(row, [200, 100])
  })
})

describe("VBox", () => {
  it("should allow 3 spacers of 100x100 size", async () => {
    const row = new VBox({
      children: [
        {child: s("red")},
        {child: s("green")},
        {child: s("blue")},
      ],
    })

    await display(row, [150, 350])
  })

  it("should allow 3 plots of 200x200 size", async () => {
    const row = new VBox({
      children: [
        {child: plot(10**0, 10**0, "red")},
        {child: plot(10**2, 10**2, "green")},
        {child: plot(10**4, 10**4, "blue")},
      ],
    })

    await display(row, [250, 650])
  })

  it("should allow to expand vertically when height policy is 'max'", async () => {
    const s0 = spacer("fixed", "max", 40, null)(["red", 0.5])
    const s1 = spacer("fixed", "fixed", 30, 60)(["green", 0.5])

    const col = new VBox({
      children: [{child: s0}, {child: s1}],
      height_policy: "max",
      styles: {background_color: "orange"},
    })
    await display(col, [100, 200])
  })
})

describe("GridBox", () => {
  const s = (color: Color) => new Spacer({styles: {background_color: color2css(color)}})

  it("should allow 3x3 grid of fixed width and height", async () => {
    const grid = new GridBox({
      width: 300,
      height: 300,
      children: [
        [s("red"),  0, 0], [s("green"),  0, 1], [s("blue"),   0, 2],
        [s("gray"), 1, 0], [s("orange"), 1, 1], [s("purple"), 1, 2],
        [s("aqua"), 2, 0], [s("maroon"), 2, 1], [s("yellow"), 2, 2],
      ],
    })

    await display(grid, [350, 350])
  })

  it("should allow 4x3 grid of fixed width and height", async () => {
    const grid = new GridBox({
      width: 300,
      height: 400,
      children: [
        [s("red"),  0, 0], [s("green"),  0, 1], [s("blue"),   0, 2],
        [s("gray"), 1, 0], [s("orange"), 1, 1], [s("purple"), 1, 2],
        [s("aqua"), 2, 0], [s("maroon"), 2, 1], [s("yellow"), 2, 2],
        [s("pink"), 3, 0], [s("plum"),   3, 1], [s("lime"),   3, 2],
      ],
    })

    await display(grid, [350, 450])
  })

  it("should allow 3x4 grid of fixed width and height", async () => {
    const grid = new GridBox({
      width: 400,
      height: 300,
      children: [
        [s("red"),  0, 0], [s("green"),  0, 1], [s("blue"),   0, 2], [s("pink"), 0, 3],
        [s("gray"), 1, 0], [s("orange"), 1, 1], [s("purple"), 1, 2], [s("plum"), 1, 3],
        [s("aqua"), 2, 0], [s("maroon"), 2, 1], [s("yellow"), 2, 2], [s("lime"), 2, 3],
      ],
    })

    await display(grid, [450, 350])
  })

  it("should allow 4x4 grid with spans of fixed width and height", async () => {
    const grid = new GridBox({
      width: 400,
      height: 400,
      children: [
        [s("red"),  0, 0, 1, 2], [s("green"),  0, 2], [s("blue"), 0, 3, 4, 1],
        [s("gray"), 1, 0, 2, 1], [s("orange"), 1, 1, 2, 2],
        [s("aqua"), 3, 0, 1, 2], [s("yellow"), 3, 2],
      ],
    })

    await display(grid, [450, 450])
  })

  it("should allow 2x2 grid with mixed frame alignment", async () => {
    const grid = new GridBox({
      width: 400,
      height: 400,
      children: [
        [plot(10**0, 10**0, "red"), 0, 0],
        [plot(10**2, 10**2, "green", {frame_align: {left: false}}), 0, 1],
        [plot(10**2, 10**2, "gray", {frame_align: {top: false, bottom: false}}), 1, 0],
        [plot(10**4, 10**4, "orange"), 1, 1],
      ],
    })

    await display(grid, [450, 450])
  })

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

    const children = items.to_sparse()
    const grid = new GridBox({children})

    await display(grid, [600, 600])
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
        margin: 0,
        stylesheets: [`
          .bk-btn {
            background-color: ${color2css(rgba)};
            color: ${is_dark(rgba) ? "white" : "black"};
            font-size: 75%;
          }
        `],
      })
    })

    const children = items.to_sparse()
    const grid = new GridBox({children, spacing: 5})

    await display(grid, [700, 700])
  })
})

describe("Tabs", () => {
  const panel = (color: string) => {
    const p = fig([100, 100])
    p.scatter([0, 5, 10], [0, 5, 10], {size: 5, color})
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
    await display(obj, [300, 150])
  })

  it("should allow tabs header location below with overflow", async () => {
    const obj = tabs("below", ["red", "green", "blue", "cyan", "magenta"])
    await display(obj, [300, 150])
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
    await display(obj, [300, 150])
  })

  it("should allow tabs header location below with overflow and active off-screen", async () => {
    const obj = tabs("below", ["red", "green", "blue", "cyan", "magenta"])
    obj.active = 3
    await display(obj, [300, 150])
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

  it("should allow axis alignment across tabs", async () => {
    const tabs = new Tabs({
      tabs: [
        new TabPanel({title: "Tab 0", child: plot(10**0, 10**0, "red")}),
        new TabPanel({title: "Tab 1", child: plot(10**2, 10**2, "green")}),
        new TabPanel({title: "Tab 2", child: plot(10**4, 10**4, "blue")}),
      ],
      tabs_location: "above",
    })
    await display(tabs, [250, 250])
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
        fig.scatter(values(xcoeff), values(ycoeff), {size: 5})
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

describe("LayoutDOM", () => {
  describe("should correctly support margin with max width and height policies", () => {
    it("for top-level layouts", async () => {
      const input = new TextInput({width_policy: "max", height_policy: "max", margin: 20})
      await display(input, [200, 100])
    })

    it("in nested layouts", async () => {
      const column = new Column({
        width_policy: "max", height_policy: "max", margin: 20,
        children: [
          new TextInput({width_policy: "max", height_policy: "max", margin: 20}),
          new TextInput({width_policy: "max", height_policy: "max", margin: 20}),
          new TextInput({width_policy: "max", height_policy: "max", margin: 20}),
        ],
      })
      await display(column, [200, 300])
    })
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

  it.allowing(3*8)("should allow changing disabled state with a checkbox", async () => {
    const group_box = new GroupBox({
      title: "Head offset:",
      checkable: true,
      disabled: false,
      child: new Column({
        children: [
          new TextInput({placeholder: "Enter value ...", prefix: "X", suffix: "mm"}),
          new TextInput({placeholder: "Enter value ...", prefix: "Y", suffix: "mm"}),
          new TextInput({placeholder: "Enter value ...", prefix: "Z", suffix: "mm"}),
        ],
      }),
    })
    const {view} = await display(group_box, [400, 200])

    await mouse_click(view.checkbox_el)
    await view.ready
  })
})

describe("ScrollBox", () => {
  it("should allow to scroll a fixed sized plot with sizing_mode='fixed'", async () => {
    const child = plot(10**2, 10**4, "blue", {
      toolbar_location: "left",
      width: 300,
      height: 300,
      sizing_mode: "fixed",
    })
    const scroll_box = new ScrollBox({
      child,
      width: 200,
      height: 200,
      sizing_mode: "fixed",
    })
    await display(scroll_box, [250, 250])
  })
})
