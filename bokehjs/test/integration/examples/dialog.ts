import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {f} from "@bokehjs/api/expr"
import type {OutputBackend} from "@bokehjs/core/enums"
import {zip} from "@bokehjs/core/util/array"
import {Random} from "@bokehjs/core/util/random"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {Column, Dialog, OpenDialog, CloseDialog} from "@bokehjs/models"
import {HTML} from "@bokehjs/models/dom"
import {Button} from "@bokehjs/models/widgets"

describe("Examples", () => {
  it("should support Dialog", async () => {
    const random = new Random(1)

    function ui(N: number, output_backend: OutputBackend) {
      const x = f`${random.floats(N)}*${100}`
      const y = f`${random.floats(N)}*${100}`
      const radii = f`${random.floats(N)}*${1.5}`
      const colors = ndarray(zip(f`${50} + ${2}*${x}`, f`${30} + ${2}*${y}`).flatMap(([r, g]) => [r, g, 150]), {shape: [N, 3], dtype: "uint8"})

      const plot = figure({
        title: `Plot with N=${N} circles`,
        output_backend,
        lod_threshold: null,
        active_scroll: "wheel_zoom",
        sizing_mode: "stretch_both",
      })
      plot.circle(x, y, radii, {fill_color: colors, fill_alpha: 0.6, line_color: null})

      const show_plot = new Button({
        label: new HTML({html: `Show plot using <b>${output_backend}</b> backend ...`}),
        sizing_mode: "stretch_width",
      })

      const close_plot = new Button({label: "Close"})
      const dialog = new Dialog({
        title: new HTML({html: `Dialog with a plot using <b>${output_backend}</b> backend`}),
        content: new Column({
          sizing_mode: "stretch_both",
          children: [
            plot,
            close_plot,
          ],
        }),
      })
      show_plot.on_click(new OpenDialog({dialog}))
      close_plot.on_click(new CloseDialog({dialog}))

      return show_plot
    }

    const layout = new Column({
      children: [
        ui(1000, "canvas"),
        ui(1000, "svg"),
        ui(1000, "webgl"),
      ],
    })

    await display(layout)
  })
})
