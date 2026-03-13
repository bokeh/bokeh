import {display, fig, row} from "#framework/layouts"
import type {OutputBackend} from "@bokehjs/core/enums"

describe("Patch glyph", () => {

  it("should support filled polygons", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      p.patch([1, 2, 3, 2.5, 0.5], [1, 0.5, 1, 2.5, 2.5], {
        fill_color: "skyblue",
        line_width: 0,
      })

      p.patch([4, 6, 7, 6.5, 5, 3.5], [1, 0.5, 2, 3, 3.5, 2], {
        fill_color: "salmon",
        line_width: 0,
        fill_alpha: 0.7,
      })

      // Fill-only polygon (no outline) to verify edge anti-aliasing
      p.patch([1.5, 3.5, 5, 4, 2], [4, 3.5, 4, 6, 6], {
        fill_color: "mediumpurple",
        line_width: 0,
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

      p.patch([1, 3, 4, 2, 0], [1, 0.5, 3, 4, 3], {
        fill_color: "lightyellow",
        line_color: "goldenrod",
        line_width: 3,
        line_dash: "dashed",
      })

      p.patch([5, 7, 8, 6.5, 4.5], [1, 0.5, 3, 4, 2.5], {
        fill_color: "lavender",
        line_color: "indigo",
        line_width: 2,
        line_dash: [8, 4, 2, 4],
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

      p.patch([1, 3, 4, 2, 0], [1, 0.5, 3, 4, 3], {
        fill_color: "lightgreen",
        line_color: "darkgreen",
        line_width: 2,
        hatch_pattern: "/",
        hatch_color: "darkgreen",
        hatch_alpha: 0.8,
      })

      p.patch([5, 7, 8, 6.5, 4.5], [1, 0.5, 3, 4, 2.5], {
        fill_color: "lightsalmon",
        line_color: "darkred",
        line_width: 2,
        hatch_pattern: "@",
        hatch_color: "darkred",
        hatch_scale: 8,
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

      // Two disjoint squares rendered as a single patch
      p.patch(
        [0, 3, 3, 0, NaN, 5, 8, 8, 5],
        [0, 0, 3, 3, NaN, 5, 5, 8, 8],
        {
          fill_color: "steelblue",
          line_color: "midnightblue",
          line_width: 2,
          fill_alpha: 0.6,
        },
      )

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

      // Outer square with inner square hole
      p.patch(
        [0, 8, 8, 0, NaN, 2, 6, 6, 2],
        [0, 0, 8, 8, NaN, 2, 2, 6, 6],
        {
          fill_color: "steelblue",
          line_color: "midnightblue",
          line_width: 2,
          fill_alpha: 0.6,
        },
      )

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
      p.patch([0, 1, 1, 0], [0, 0, 1, 1], {
        fill_color: "black",
        fill_alpha: 0.5,
        line_color: null,
      })

      p.patch([1, 2, 2, 1], [0, 0, 1, 1], {
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
