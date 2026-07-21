import {display, fig, row} from "#framework/layouts"

import type {LineDash, OutputBackend} from "@bokehjs/core/enums"
import {ColumnDataSource, Selection} from "@bokehjs/models"

describe("WebGL multiline stability", () => {
  type DashPattern = LineDash | number[]

  const xs = [
    [0.4, 1.4, 2.4, 3.6],
    [],
    [0.4, 1.5, 2.5, 3.6],
    [0.4, 1.6, 2.6, 3.6],
  ]
  const ys = [
    [1.2, 1.8, 1.2, 1.8],
    [],
    [3.2, 3.8, 3.2, 3.8],
    [4.2, 4.8, 4.2, 4.8],
  ]
  const scalar_ys = ys.map((line) => line.map((y) => y + 4))
  const colors = ["#d62728", "#9467bd", "#2ca02c", "#1f77b4"]

  function plot(output_backend: OutputBackend) {
    const source = new ColumnDataSource({
      data: {
        xs,
        ys,
        scalar_ys,
        colors,
        dashes: [[1.5, 0.5], [2.25, 0.75], [3.5, 1.25], [0.75, 1.5]],
      },
      selected: new Selection({indices: [0, 3]}),
    })
    const p = fig([300, 360], {
      output_backend,
      title: output_backend,
      x_range: [0, 4],
      y_range: [0, 9],
    })
    p.xgrid.visible = false
    p.ygrid.visible = false

    const common = {
      xs: {field: "xs"} as const,
      source,
      line_color: {field: "colors"} as const,
      line_width: 5,
      selection_line_color: "#ff7f0e",
      nonselection_line_alpha: 0.35,
    }
    p.multi_line({
      ...common,
      ys: {field: "ys"},
      line_dash: {field: "dashes"},
    })
    p.multi_line({
      ...common,
      ys: {field: "scalar_ys"},
      line_dash: {value: [1.5, 0.75]},
    })
    return p
  }

  it("should render fractional scalar and vector dash patterns with empty paths and non-contiguous selection", async () => {
    await display(row([plot("canvas"), plot("webgl")]))
  })

  it("should replace dash textures after a post-render dash-field update", async () => {
    function updated_plot(output_backend: OutputBackend) {
      const dashes: DashPattern[] = [[8, 4], [8, 4], [8, 4], [8, 4]]
      const source = new ColumnDataSource({
        data: {
          xs,
          ys,
          colors,
          dashes,
        },
      })
      const p = fig([300, 240], {
        output_backend,
        title: output_backend,
        x_range: [0, 4],
        y_range: [0, 5],
      })
      p.xgrid.visible = false
      p.ygrid.visible = false
      p.multi_line({
        xs: {field: "xs"},
        ys: {field: "ys"},
        source,
        line_color: {field: "colors"},
        line_width: 5,
        line_dash: {field: "dashes"},
      })
      return {p, source}
    }

    const canvas = updated_plot("canvas")
    const webgl = updated_plot("webgl")
    const {view} = await display(row([canvas.p, webgl.p]))

    const dashes: DashPattern[] = [[], [1.5, 0.5], [2.5, 0.75], [0.75, 1.25]]
    canvas.source.data = {...canvas.source.data, dashes}
    webgl.source.data = {...webgl.source.data, dashes}
    await view.ready
  })
})
