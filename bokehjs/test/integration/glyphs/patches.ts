import {display, fig, row} from "../_util"
import type {OutputBackend} from "@bokehjs/core/enums"

describe("Patches glyph", () => {

  it("should support filled polygons", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      p.patches({
        xs: [[1, 3, 2], [4, 6, 7, 5], [1, 3, 4, 2], [5, 7, 8, 6]],
        ys: [[1, 1, 3], [1, 0.5, 2.5, 3], [4, 4, 6, 6], [4, 4, 6, 6]],
        fill_color: ["skyblue", "salmon", "lightgreen", "mediumpurple"],
        line_color: ["navy", "firebrick", "darkgreen", "mediumpurple"],
        line_width: [2, 2, 2, 0],
        fill_alpha: 0.7,
      })

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support dashed line outlines", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      p.patches({
        xs: [[1, 3, 4, 2], [5, 7, 8, 6], [1, 4, 3, 0.5]],
        ys: [[1, 0.5, 3, 3.5], [1, 0.5, 3, 3.5], [5, 5, 7, 7]],
        fill_color: ["lightyellow", "lavender", "honeydew"],
        line_color: ["goldenrod", "indigo", "seagreen"],
        line_width: 3,
        line_dash: "dashed",
      })

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support hatch patterns", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      p.patches({
        xs: [[1, 3, 4, 2], [5, 7, 8, 6], [1, 4, 3, 0.5]],
        ys: [[1, 0.5, 3, 3.5], [1, 0.5, 3, 3.5], [5, 5, 7, 7]],
        fill_color: ["lightgreen", "lightsalmon", "lightblue"],
        line_color: ["darkgreen", "darkred", "darkblue"],
        line_width: 2,
        hatch_pattern: ["/", "@", "+"],
        hatch_color: ["darkgreen", "darkred", "darkblue"],
        hatch_alpha: 0.8,
      })

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support disjoint parts via NaN separator", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      p.patches({
        xs: [
          [0, 3, 3, 0, NaN, 5, 8, 8, 5],              // two disjoint squares
          [10, 13, 13, 10, NaN, 15, 18, 18, 15, NaN, 12, 16, 14],  // two squares + triangle
        ],
        ys: [
          [0, 0, 3, 3, NaN, 5, 5, 8, 8],
          [0, 0, 3, 3, NaN, 5, 5, 8, 8, NaN, 10, 10, 13],
        ],
        fill_color: ["steelblue", "coral"],
        line_color: ["midnightblue", "darkred"],
        line_width: 2,
        fill_alpha: 0.6,
      })

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support polygons with holes via NaN separator", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      p.patches({
        xs: [
          [0, 8, 8, 0, NaN, 2, 6, 6, 2],          // square with square hole
          [10, 18, 14, NaN, 12, 16, 14],            // triangle with triangular hole
        ],
        ys: [
          [0, 0, 8, 8, NaN, 2, 2, 6, 6],
          [0, 0, 7, NaN, 1.5, 1.5, 5],
        ],
        fill_color: ["steelblue", "coral"],
        line_color: ["midnightblue", "darkred"],
        line_width: 2,
        fill_alpha: 0.6,
      })

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should show edge seaming artifact with adjacent semi-transparent fill-only polygons", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})
      p.xgrid.visible = false
      p.ygrid.visible = false

      // Two adjacent rectangles sharing an edge, semi-transparent, no outline
      // WebGL shows thin seam at shared edge due to independent AA skirt compositing
      p.patches({
        xs: [
          [0, 1, 1, 0],      // left rectangle
          [1, 2, 2, 1],      // right rectangle (shares edge with left at x=1)
        ],
        ys: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        fill_color: "black",
        fill_alpha: 0.5,
        line_color: null,
      })

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })
})
