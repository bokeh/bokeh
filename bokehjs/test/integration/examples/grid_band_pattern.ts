import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {f} from "@bokehjs/api/expr"
import {linspace} from "@bokehjs/core/util/array"
import {SingleIntervalTicker} from "@bokehjs/models"

const {PI} = Math

describe("Examples", () => {
  it("should support GridBandPattern", async () => {
    const p = figure({width: 600, height: 300, toolbar_location: null})

    const x = linspace(0, 4*PI)
    const y = f`np.sin(${x})`
    p.line(x, y, {line_color: "#3577b3"})

    p.xaxis.ticker = new SingleIntervalTicker({interval: PI/2})
    p.xgrid.ticker = new SingleIntervalTicker({interval: PI})

    p.xaxis.major_label_overrides = new Map([
      [  PI/2, "π/2"],
      [  PI,   "π"],
      [3*PI/2, "3π/2"],
      [2*PI,   "2π"],
      [5*PI/2, "5π/2"],
      [3*PI,   "3π"],
      [7*PI/2, "7π/2"],
      [4*PI,   "4π"],
    ])

    p.xgrid.band_hatch_pattern = "/"
    p.xgrid.band_hatch_color = "#e4e4e4"
    p.ygrid.grid_line_color = null

    await display(p)
  })
})
