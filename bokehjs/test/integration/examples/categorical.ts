import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {Row} from "@bokehjs/models"

describe("Examples", () => {
  it("should support Categorical", async () => {
    const dot = () => {
      const factors = ["a", "b", "c", "d", "e", "f", "g", "h"]
      const x = [50, 40, 65, 10, 25, 37, 80, 60]

      const fig = figure({
        title: "Categorical Dot Plot",
        tools: "",
        toolbar_location: null,
        y_range: factors,
        x_range: [0, 100],
      })

      fig.segment(0, factors, x, factors, {line_width: 2, line_color: "green"})
      fig.scatter(x, factors, {size: 15, fill_color: "orange", line_color: "green", line_width: 3})
      return fig
    }

    const hm = () => {
      const factors = ["foo", "bar", "baz"]
      const x = ["foo", "foo", "foo", "bar", "bar", "bar", "baz", "baz", "baz"]
      const y = ["foo", "bar", "baz", "foo", "bar", "baz", "foo", "bar", "baz"]
      const colors = [
        "#0B486B", "#79BD9A", "#CFF09E",
        "#79BD9A", "#0B486B", "#79BD9A",
        "#CFF09E", "#79BD9A", "#0B486B",
      ]

      const fig = figure({
        title: "Categorical Heatmap",
        tools: "hover",
        toolbar_location: null,
        x_range: factors,
        y_range: factors,
      })

      fig.rect(x, y, 1, 1, {color: colors})
      return fig
    }

    const layout = new Row({children: [hm(), dot()]})
    await display(layout)
  })
})
