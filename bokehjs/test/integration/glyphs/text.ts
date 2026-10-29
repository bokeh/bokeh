import {display, fig} from "#framework/layouts"
import type {TextAlign, TextBaseline} from "@bokehjs/core/enums"
import {ColumnDataSource} from "@bokehjs/models"

describe("Text glyph", () => {
  it("should support basic positioning", async () => {
    const p = fig([300, 300], {x_range: [0, 10], y_range: [0, 10]})

    const source = ColumnDataSource.create({
      data: {
        text: ["First label", "Second label\nspanning two lines", "Third label\nspanning\nthree lines", null, "Not shown"],
        x1: [1, 3, 7, 9, NaN],
        y1: [7, 5, 3, 1, NaN],
        x2: [1, 2.5, 5, 6.5, NaN],
      },
    })

    p.text({
      x: {field: "x1"}, y: {field: "y1"},
      x_offset: -10, y_offset: 25,
      angle: {value: 15, units: "deg"},
      text: {field: "text"},
      source,
      text_font_size: "24px", text_color: "red", text_alpha: 0.9, text_baseline: "bottom", text_align: "left",
      background_fill_color: "green", background_fill_alpha: 0.8,
      border_line_color: "blue",
    })

    p.text({
      x: {field: "x2"}, y: 1,
      x_offset: 0, y_offset: -5,
      angle: {value: 0.25, units: "turn"},
      text: {field: "text"},
      source,
      text_font_size: "18px", text_color: "black", text_alpha: 0.9, text_baseline: "top", text_align: "left",
      background_fill_color: "orange", background_fill_alpha: 0.8,
      border_line_color: "red", border_line_width: 3,
    })

    await display(p)
  })

  it("should allow to paint text with embedded scripts", async () => {
    const p = fig([250, 100], {x_range: [0, 16], y_range: [0, 2]})
    p.text(0, 0, ["</script><script>throw new Error('XSS1')</script>"])
    p.text(0, 1, ["<script>throw new Error('XSS0')</script>"])
    await display(p)
  })

  describe("should support multi-line rendering with different alignments", () => {
    function plot(angle: number) {
      const aligns    = ["left", "center", "right"] as const
      const baselines = ["bottom", "middle", "top"] as const

      const p = fig([800, 400], {x_range: aligns, y_range: baselines})

      p.xaxis.axis_label = "align"
      p.yaxis.axis_label = "baseline"
      p.yaxis.major_label_orientation = "parallel"
      p.axis.major_label_text_font_size = "12px"
      p.axis.major_label_text_font_style = "bold italic"

      p.xgrid.grid_line_color = null
      p.ygrid.grid_line_color = null

      const texts = [
        "one",
        "two\nlines",
        "lines\nhere:\n3",
        "here\nare\n4\nlines",
      ]

      const x4 = <T>(cat: T) => [cat, cat, cat, cat]

      function xs(cat: string): [string, number][] {
        return [[cat, -0.3], [cat, -0.1], [cat, 0.1], [cat, 0.3]]
      }

      const x = []
      const y = []
      const text = []
      const text_align: TextAlign[] = []
      const text_baseline: TextBaseline[] = []
      const text_color = []

      for (const align of aligns) {
        for (const baseline of baselines) {
          x.push(...xs(align))
          y.push(...x4(baseline))
          text.push(...texts)
          text_align.push(...x4(align))
          text_baseline.push(...x4(baseline))
          text_color.push("black", "gray", "blue", "green")
        }
      }

      p.text({
        x: x as any, // TODO: offset factors
        y,
        text,
        text_align,
        text_baseline,
        text_color,
        angle: {value: angle, units: "deg"},
        text_font_size: "10px",
      })

      return p
    }

    for (const angle of [-30, 0, 30, 60]) {
      it(`at ${angle} degree angle`, async () => {
        const p = plot(angle)
        await display(p)
      })
    }
  })
})
