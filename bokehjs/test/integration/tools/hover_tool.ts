import {display, fig} from "../_util"
import {PlotActions, actions, xy} from "../../interactive"

import {HoverTool} from "@bokehjs/models"
import {Div, ValueRef, Index, Styles} from "@bokehjs/models/dom"
import {linspace} from "@bokehjs/core/util/array"
import {Random} from "@bokehjs/core/util/random"

describe("HoverTool", () => {
  it("should support formatting with templated and regular tooltips", async () => {
    const p = fig([300, 300])
    p.circle({
      x: [0, 1, 2],
      y: [0, 1, 2],
      radius: [1.4325234, 1.1994322, 1.921211523],
      fill_color: ["red", "green", "blue"],
      fill_alpha: 0.5,
    })

    const grid = new Div({
      style: new Styles({
        display: "grid",
        grid_template_columns: "auto auto",
        column_gap: "10px",
      }),
      children: [
        "index:",  new Div({children: ["#", new Index()]}),
        "(x, y):", new Div({children: ["(", new ValueRef({field: "x"}), ", ", new ValueRef({field: "y"}), ")"]}),
        "radius:", new ValueRef({field: "radius", format: "%.2f", formatter: "printf"}),
      ],
    })

    const hover_templated = new HoverTool({
      description: "Templated hover",
      tooltips: grid,
      attachment: "left",
      point_policy: "follow_mouse",
    })
    p.add_tools(hover_templated)

    const hover_regular = new HoverTool({
      description: "Regular hover",
      tooltips: [
        ["index", "$index"],
        ["(x,y)", "(@x, @y)"],
        ["radius", "@radius{%.2f}"],
      ],
      formatters: {
        "@radius": "printf",
      },
      attachment: "right",
      point_policy: "follow_mouse",
    })
    p.add_tools(hover_regular)

    const {view} = await display(p)
    const actions = new PlotActions(view)
    await actions.hover(xy(1, 1))
    await view.ready
  })

  async function mkplot(mode: "hline" | "vline") {
    const random = new Random(1)
    const N = 50
    const v0 = linspace(0, 10, N)
    const v1 = random.floats(N, 0, 1)
    const [x, y] = mode == "hline" ? [v0, v1] : [v1, v0]

    const p = fig([200, 200], {background_fill_color: "#fafafa"})
    p.line(x, y, {line_dash: [4, 4], line_width: 1, color: "gray"})

    const sr = p.scatter(x, y, {
      size: 20,
      fill_color: "steelblue", alpha: 0.1, line_color: null,
      hover_fill_color: "midnightblue", hover_alpha: 0.5, hover_line_color: "white",
    })

    const hover = new HoverTool({tooltips: null, renderers: [sr], mode})
    p.add_tools(hover)

    return await display(p)
  }

  it("support hover on x-axis when mode=='vline'", async () => {
    const {view} = await mkplot("vline")
    await actions(view, {units: {y: "screen"}}).hover(xy(0.5, 190))
  })

  it("support hover on y-axis when mode=='hline'", async () => {
    const {view} = await mkplot("hline")
    await actions(view, {units: {x: "screen"}}).hover(xy(10, 0.5))
  })

  it("should support hover on step glyphs", async () => {
    const p = fig([300, 300])
    const x = [0, 1, 2]
    const y1 = [1, 2, 3]
    const y2 = [5, 4, 6]
    const y3 = [9, 8, 7]
    const r1 = p.step(x, y1, "before", {line_width: 1, color: "red", name: "before"})
    const r2 = p.step(x, y2, "after", {line_width: 1, color: "green", name: "after"})
    const r3 = p.step(x, y3, "center", {line_width: 1, color: "blue", name: "center"})
    const hover = new HoverTool({
      tooltips: [
        ["mode", "$name"],
        ["x", "@x{0.00}"],
        ["y", "@y{0.00}"],
      ],
      renderers: [r1, r2, r3],
      mode: "vline",
    })
    p.add_tools(hover)
    const {view} = await display(p)
    await actions(view).hover(xy(1, 1))
    await view.ready
  })
})
