import {LayoutDOM, Row, Column, GridBox, Spacer} from "models/layouts/index"
import {ToolbarBox} from "models/tools/toolbar_box"
import {figure, gridplot, show} from "api/plotting"
import {Matrix} from "core/util/data_structures"
import {range} from "core/util/array"
import {SizingPolicy} from "core/layout"
import {Color} from "core/types"
import {Location} from "core/enums"
import {div} from "core/dom"

function display(obj: LayoutDOM, viewport: [number, number] = [1000, 1000]) {
  const [width, height] = viewport
  const el = div({style: {width: `${width}px`, height: `${height}px`}})
  document.body.appendChild(el)
  return show(obj, el)
}

function grid(items: Matrix<LayoutDOM> | LayoutDOM[][], opts?: Partial<GridBox.Attrs>): GridBox {
  const children = Matrix.from(items).to_sparse()
  return new GridBox({...opts, children})
}

function row(children: LayoutDOM[], opts?: Partial<Row.Attrs>): Row {
  return new Row({...opts, children})
}

function column(children: LayoutDOM[], opts?: Partial<Column.Attrs>): Column {
  return new Column({...opts, children})
}

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

const colors = Matrix.from([
  ["red",  "green",  "blue"   ],
  ["gray", "orange", "fuchsia"],
  ["aqua", "maroon", "yellow" ],
])

_describe("3x3 grid, 300px x 300px viewport", () => {
  _test("fixed spacers 50px x 50px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items)
    await display(l, [300, 300])
  })

  _test("fixed spacers 50px x 50px, spacing 5px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {spacing: 5})
    await display(l, [300, 300])
  })

  _test("fixed spacers 50px x 50px, hspacing 5px, vspacing 10px", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s0, s0],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {spacing: [5, 10]})
    await display(l, [300, 300])
  })

  _test("fixed & 1 x-max spacers, c2 auto", async () => {
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

  _test("fixed & 2 x-max spacers, c2 auto", async () => {
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

  _test("fixed & 2 x-max spacers, c2 flex/2", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)
    const s1 = spacer("max", "fixed", 50, 50)

    const items = colors.apply([
      [s0, s1, s1],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {cols: {2: {policy: "flex", factor: 2}}})
    await display(l, [300, 300])
  })

  _test("fixed & 3 x-max spacers, c2 flex/2", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)
    const s1 = spacer("max", "fixed", 50, 50)

    const items = colors.apply([
      [s1, s1, s1],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {cols: {2: {policy: "flex", factor: 2}}})
    await display(l, [300, 300])
  })

  _test("fixed & 3 x-max spacers, c2 flex/2:end", async () => {
    const s0 = spacer("fixed", "fixed", 50, 50)
    const s1 = spacer("max", "fixed", 50, 50)

    const items = colors.apply([
      [s1, s1, s1],
      [s0, s0, s0],
      [s0, s0, s0],
    ])

    const l = grid(items, {cols: {2: {policy: "flex", factor: 2, align: "end"}}})
    await display(l, [300, 300])
  })

  _test("fixed, inconsistent width/height, row/col auto:start", async () => {
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

  _test("fixed, inconsistent width/height, row/col auto:center", async () => {
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

  _test("fixed, inconsistent width/height, row/col auto:end", async () => {
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

_describe("Plot", () => {
  const fig = (toolbar_location: Location | null) => {
    const p = figure({width: 200, height: 200, tools: "pan,reset,help", toolbar_location})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    return p
  }

  _test("should allow no toolbar", async () => {
    await display(fig(null), [300, 300])
  })

  _test("should allow toolbar placement above", async () => {
    await display(fig("above"), [300, 300])
  })

  _test("should allow toolbar placement below", async () => {
    await display(fig("below"), [300, 300])
  })

  _test("should allow toolbar placement left", async () => {
    await display(fig("left"), [300, 300])
  })

  _test("should allow toolbar placement right", async () => {
    await display(fig("right"), [300, 300])
  })

  _test("should allow fixed frame", async () => {
    const fig = figure({frame_width: 300, frame_height: 300})
    fig.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(fig, [500, 500])
  })
})

_describe("ToolbarBox", () => {
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

  _test("should allow above placement", async () => {
    await display(tb_above(), [300, 300])
  })

  _test("should allow below placement", async () => {
    await display(tb_below(), [300, 300])
  })

  _test("should allow left placement", async () => {
    await display(tb_left(),  [300, 300])
  })

  _test("should allow right placement", async () => {
    await display(tb_right(), [300, 300])
  })
})

_describe("gridplot()", function() {
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

  _test("should align axes", async () => {
    await display(layout(null), [800, 800])
  })

  _test("should align axes when toolbar_location='above'", async () => {
    await display(layout("above"), [800, 800])
  })

  _test("should align axes when toolbar_location='right'", async () => {
    await display(layout("right"), [800, 800])
  })

  _test("should align axes when toolbar_location='left'", async () => {
    await display(layout("left"), [800, 800])
  })

  _test("should align axes when toolbar_location='below'", async () => {
    await display(layout("below"), [800, 800])
  })
})
