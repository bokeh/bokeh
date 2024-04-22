import {display} from "../_util"

import {figure, gridplot} from "@bokehjs/api/plotting"

describe("Examples", () => {
  it("should support plotting/Aspect", async () => {
    const p1 = figure({match_aspect: true, title: "Circle touches all 4 sides of square"})
    p1.rect(0, 0, 300, 300, {line_color: "black"})
    p1.circle({x: 0, y: 0, radius: 150, line_color: "black", fill_color: "grey", radius_units: "data"})

    function draw_test_figure({aspect_scale=1, width=300, height=300}: {aspect_scale?: number, width?: number, height?: number}) {
      const p = figure({
        width,
        height,
        match_aspect: true,
        aspect_scale,
        title: `Aspect scale = ${aspect_scale}`,
        toolbar_location: null,
      })
      p.scatter([-1, +1, +1, -1], [-1, -1, +1, +1])
      return p
    }

    const aspect_scales = [0.25, 0.5, 1, 2, 4]
    const p2s = aspect_scales.map((aspect_scale) => draw_test_figure({aspect_scale}))

    const sizes = [[100, 400], [200, 400], [400, 200], [400, 100]] as const
    const p3s = sizes.map(([width, height]) => draw_test_figure({width, height}))

    const layout = gridplot([[p1], p2s, p3s])
    await display(layout)
  })
})
