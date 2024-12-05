import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {f} from "@bokehjs/api/expr"
import {np} from "@bokehjs/api/linalg"
import {gridplot} from "@bokehjs/api/gridplot"
import {CustomJS, CustomAction} from "@bokehjs/models"

describe("Examples", () => {
  it("should support LegendVisibilityTool", async () => {
    const TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

    const x = np.linspace(0, 4*Math.PI, 100)
    const y = f`np.sin(${x})`

    const p1 = figure({title: "Legend Example", tools: TOOLS})

    p1.scatter(x,       y,   {legend_label: "sin(x)"})
    p1.scatter(x, f`2*${y}`, {legend_label: "2*sin(x)", color: "orange"})
    p1.scatter(x, f`3*${y}`, {legend_label: "3*sin(x)", color: "green"})

    p1.legend.title = "Markers"

    const p2 = figure({title: "Another Legend Example", tools: TOOLS})

    p2.scatter(x, y, {legend_label: "sin(x)"})
    p2.line(x, y, {legend_label: "sin(x)"})

    p2.line(x, f`2*${y}`, {legend_label: "2*sin(x)", line_dash: [4, 4], line_color: "orange", line_width: 2})

    p2.scatter(x, f`3*${y}`, {legend_label: "3*sin(x)", marker: "square", fill_color: null, line_color: "green"})
    p2.line(x, f`3*${y}`, {legend_label: "3*sin(x)", line_color: "green"})

    p2.legend.title = "Lines"

    const legends = [p1.legend, p2.legend]

    const toggle_legend = new CustomAction({
      icon: ".bk-tool-icon-list",
      description: "Toggle legend",
      callback: new CustomJS({
        args: {legends},
        code: `
        export default ({legends}) => {
          for (const legend of legends) {
            legend.visible = !legend.visible
          }
        }
        `,
      }),
      active_callback() {
        return legends.every((legend) => legend.visible)
      },
      // or alternatively use:
      //
      // active_callback: "auto",
      // active: p1.legend.visible && p2.legend.visible,
    })

    const gp = gridplot([p1, p2], {ncols: 2, width: 400, height: 400})
    gp.toolbar.tools = [...gp.toolbar.tools, toggle_legend]

    await display(gp)
  })
})
