import {display, fig} from "#framework/layouts"
import {actions, xy} from "#framework/interactive"
import type {TextAlign, TextBaseline} from "@bokehjs/core/enums"
import {HoverTool} from "@bokehjs/models"

describe("Text glyph", () => {
  it("should allow to paint text with embedded scripts", async () => {
    const p = fig([250, 100], {x_range: [0, 16], y_range: [0, 2]})
    p.text(0, 0, ["</script><script>throw new Error('XSS1')</script>"])
    p.text(0, 1, ["<script>throw new Error('XSS0')</script>"])
    await display(p)
  })

  it("should support bounding box visuals in all glyph states", async () => {
    const p = fig([300, 250], {x_range: [0, 4], y_range: [-0.5, 3.5]})
    p.axis.visible = false
    p.grid.visible = false

    const style = {
      text_font_size: "16px", text_align: "center", text_baseline: "middle", padding: 5,
      background_fill_color: "yellow", background_hatch_pattern: "/", background_hatch_color: "orange",
      border_line_color: "black", border_line_width: 2, border_radius: 4,
    } as const

    p.text({x: [2], y: [3], text: ["normal"], ...style})

    const selection = p.text({x: [1, 3], y: [2, 2], text: ["selected", "nonselected"], ...style})
    selection.data_source.selected.indices = [0]

    const muted = p.text({x: [2], y: [1], text: ["muted"], ...style})
    muted.muted = true

    const hover = p.text({
      x: [1, 3], y: [0, 0], text: ["hovered", "not hovered"], ...style,
      hover_background_fill_color: "lightgreen", hover_background_hatch_color: "green", hover_border_line_color: "red",
    })
    p.add_tools(HoverTool.create({renderers: [hover], tooltips: null}))

    const {view} = await display(p)
    await actions(view).hover(xy(1, 0))
    await view.ready
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
