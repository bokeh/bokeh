import {display, fig} from "../_util"

import {Slope} from "@bokehjs/models"
import {max} from "@bokehjs/core/util/arrayable"
import {range} from "@bokehjs/core/util/array"
import {zip} from "@bokehjs/core/util/iterator"
import {Random} from "@bokehjs/core/util/random"

describe("Slope annotation", () => {

  it("should support basic positioning", async () => {
    const random = new Random(1)

    const gradient = 2
    const y_intercept = 10

    const xpts = range(0, 20)
    const ypts = [...zip(xpts, random.normal(0, 4, 20))].map(([x, r]) => gradient*x + y_intercept + r)

    const plot = fig([300, 300], {y_range: [0, 1.1*max(ypts)]})
    plot.circle(xpts, ypts, {size: 5, color: "skyblue"})

    const slope = new Slope({gradient, y_intercept, line_color: "orange", line_dash: "dashed", line_width: 3.5})
    plot.add_layout(slope)

    plot.yaxis.axis_label = "y"
    plot.xaxis.axis_label = "x"

    await display(plot)
  })
})
