import {describe, it, display} from "./framework"

import {LayoutDOM, Row, Column, GridBox, Spacer, Tabs, Panel} from "models/layouts/index"
import {ToolbarBox} from "models/tools/toolbar_box"
import {
  Button, Toggle, Dropdown,
  CheckboxGroup, RadioGroup,
  CheckboxButtonGroup, RadioButtonGroup,
  TextInput, AutocompleteInput,
  Select, MultiSelect,
  Slider, RangeSlider, DateSlider, DateRangeSlider,
  DatePicker,
  Paragraph, Div, PreText,
} from "models/widgets/index"
import {figure, gridplot, color} from "api/plotting"
import {Matrix} from "core/util/data_structures"
import {range} from "core/util/array"
import {SizingPolicy} from "core/layout"
import {Color} from "core/types"
import {Location} from "core/enums"

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

  it("fixed spacers 50px x 50px, hspacing 5px, vspacing 10px", async () => {
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

    const l = grid(items, {cols: {2: {policy: "flex", factor: 2}}})
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

    const l = grid(items, {cols: {2: {policy: "flex", factor: 2}}})
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

    const l = grid(items, {cols: {2: {policy: "flex", factor: 2, align: "end"}}})
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

describe("Plot", () => {
  const fig = (location: Location | null, title?: string) => {
    const p = figure({
      width: 200, height: 200, tools: "pan,reset", title,
      toolbar_location: location, title_location: location})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    return p
  }

  it("should allow no toolbar and no title", async () => {
    await display(fig(null), [300, 300])
  })

  it("should allow toolbar placement above without title", async () => {
    await display(fig("above"), [300, 300])
  })

  it("should allow toolbar placement below without title", async () => {
    await display(fig("below"), [300, 300])
  })

  it("should allow toolbar placement left without title", async () => {
    await display(fig("left"), [300, 300])
  })

  it("should allow toolbar placement right without title", async () => {
    await display(fig("right"), [300, 300])
  })

  it("should allow toolbar placement above with title", async () => {
    await display(fig("above", "Plot Title"), [300, 300])
  })

  it("should allow toolbar placement below with title", async () => {
    await display(fig("below", "Plot Title"), [300, 300])
  })

  it("should allow toolbar placement left with title", async () => {
    await display(fig("left", "Plot Title"), [300, 300])
  })

  it("should allow toolbar placement right with title", async () => {
    await display(fig("right", "Plot Title"), [300, 300])
  })

  it("should allow fixed x fixed plot", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "fixed", height: 200})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max"})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot", async () => {
    const p = figure({width_policy: "max", height_policy: "max"})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot, aspect 0.8", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200, aspect_ratio: 0.8})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot, aspect 0.8", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max", aspect_ratio: 0.8})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot, aspect 0.8", async () => {
    const p = figure({width_policy: "max", height_policy: "max", aspect_ratio: 0.8})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot, aspect 1.0", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200, aspect_ratio: 1.0})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot, aspect 1.0", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max", aspect_ratio: 1.0})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot, aspect 1.0", async () => {
    const p = figure({width_policy: "max", height_policy: "max", aspect_ratio: 1.0})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot, aspect 1.25", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200, aspect_ratio: 1.25})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot, aspect 1.25", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max", aspect_ratio: 1.25})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot, aspect 1.25", async () => {
    const p = figure({width_policy: "max", height_policy: "max", aspect_ratio: 1.25})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed frame 300px x 300px", async () => {
    const fig = figure({frame_width: 300, frame_height: 300})
    fig.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(fig, [500, 500])
  })

  it("should allow fixed frame 200px x 200px in a layout", async () => {
    const fig0 = figure({frame_width: 200, frame_height: 200})
    fig0.circle([0, 5, 10], [0, 5, 10], {size: 10})
    const fig1 = figure({frame_width: 200, frame_height: 200})
    fig1.circle([0, 5, 10], [0, 5, 10], {size: 10})
    const row = new Row({children: [fig0, fig1]})
    await display(row, [600, 300])
  })

  it("should allow fixed frame 200px x 200px in a layout with a title", async () => {
    const fig0 = figure({frame_width: 200, frame_height: 200, title: "A title"})
    fig0.circle([0, 5, 10], [0, 5, 10], {size: 10})
    const fig1 = figure({frame_width: 200, frame_height: 200})
    fig1.circle([0, 5, 10], [0, 5, 10], {size: 10})
    const row = new Row({children: [fig0, fig1]})
    await display(row, [600, 300])
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

describe("Widgets", () => {
  it("should allow Button", async () => {
    const obj = new Button({label: "Button 1", button_type: "primary"})
    await display(obj, [500, 100])
  })

  it("should allow Toggle", async () => {
    const obj = new Toggle({label: "Toggle 1", button_type: "primary"})
    await display(obj, [500, 100])
  })

  it("should allow Dropdown", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = new Dropdown({label: "Dropdown 1", button_type: "primary", menu})
    await display(obj, [500, 100])
  })

  it("should allow split Dropdown", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = new Dropdown({label: "Dropdown 2", button_type: "primary", menu, split: true})
    await display(obj, [500, 100])
  })

  it("should allow CheckboxGroup", async () => {
    const obj = new CheckboxGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
    await display(obj, [500, 100])
  })

  it("should allow RadioGroup", async () => {
    const obj = new RadioGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
    await display(obj, [500, 100])
  })

  it("should allow CheckboxButtonGroup", async () => {
    const obj = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
    await display(obj, [500, 100])
  })

  it("should allow RadioButtonGroup", async () => {
    const obj = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
    await display(obj, [500, 100])
  })

  it("should allow TextInput", async () => {
    const obj = new TextInput({placeholder: "Enter value ..."})
    await display(obj, [500, 100])
  })

  it("should allow AutocompleteInput", async () => {
    const completions = ["aaa", "aab", "aac", "baa", "caa"]
    const obj = new AutocompleteInput({placeholder: "Enter value ...", completions})
    await display(obj, [500, 100])
  })

  it("should allow Select", async () => {
    const obj = new Select({options: ["Option 1", "Option 2", "Option 3"]})
    await display(obj, [500, 100])
  })

  it("should allow MultiSelect", async () => {
    const options = range(16).map((i) => `Option ${i+1}`)
    const obj = new MultiSelect({options, size: 6})
    await display(obj, [500, 150])
  })

  it("should allow Slider", async () => {
    const obj = new Slider({value: 10, start: 0, end: 100, step: 0.5})
    await display(obj, [500, 100])
  })

  it("should allow DateSlider", async () => {
    const obj = new DateSlider({
      value: Date.UTC(2016, 1, 1),
      start: Date.UTC(2015, 1, 1),
      end: Date.UTC(2017, 12, 31),
    })
    await display(obj, [500, 100])
  })

  it("should allow RangeSlider", async () => {
    const obj = new RangeSlider({value: [10, 90], start: 0, end: 100, step: 0.5})
    await display(obj, [500, 100])
  })

  it("should allow DateRangeSlider", async () => {
    const obj = new DateRangeSlider({
      value: [Date.UTC(2016, 1, 1), Date.UTC(2016, 12, 31)],
      start: Date.UTC(2015, 1, 1),
      end: Date.UTC(2017, 12, 31),
    })
    await display(obj, [500, 100])
  })

  it("should allow DatePicker", async () => {
    const obj = new DatePicker({value: new Date(Date.UTC(2017, 8, 1)).toDateString()})
    await display(obj, [500, 100])
  })

  it("should allow Div", async () => {
    const obj = new Div({text: "some <b>text</b>"})
    await display(obj, [500, 100])
  })

  it("should allow Paragraph", async () => {
    const obj = new Paragraph({text: "some text"})
    await display(obj, [500, 100])
  })

  it("should allow PreText", async () => {
    const obj = new PreText({text: "some text"})
    await display(obj, [500, 100])
  })
})

describe("Rows of widgets", () => {

  it("should allow different content and fixed height", async () => {
    const w0 = new TextInput({value: "Widget 1"})
    const w1 = new TextInput({value: "Widget 2", height: 50})
    const row = new Row({children: [w0, w1]})

    await display(row, [500, 100])
  })
})

describe("Tabs", () => {
  const panel = (color: string) => {
    const p = figure({width: 200, height: 200, toolbar_location: null})
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
