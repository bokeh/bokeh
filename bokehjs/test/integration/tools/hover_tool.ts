import {display, fig} from "../_util"
import {PlotActions, xy} from "../../interactive"

import {HoverTool} from "@bokehjs/models"
import {Div, ValueRef, Index, Styles} from "@bokehjs/models/dom"

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
})
