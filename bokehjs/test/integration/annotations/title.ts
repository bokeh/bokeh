import {display, fig, row} from "../_util"
import {tex} from "./_text_utils"

import type {OutputBackend} from "@bokehjs/core/enums"
import {TextAlign} from "@bokehjs/core/enums"
import {Title} from "@bokehjs/models"

const r = String.raw

describe("Title annotation", () => {
  describe("should support positioning", () => {
    function plot(attrs: Partial<Title.Attrs>) {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([400, 400], {
          output_backend, title: output_backend,
          x_axis_type: null, y_axis_type: null, x_range: [0, 1], y_range: [0, 1],
        })

        p.add_layout(new Title({text: "1st Left (Ag/9)", ...attrs}), "left")
        p.add_layout(new Title({text: "Second Left (Ag/9)\nspanning two lines", ...attrs}), "left")
        p.add_layout(new Title({text: r`$$\text{Left: } ${tex}$$`, ...attrs}), "left")

        p.add_layout(new Title({text: "1st Right (Ag/9)", ...attrs}), "right")
        p.add_layout(new Title({text: "Second Right (Ag/9)\nspanning two lines", ...attrs}), "right")
        p.add_layout(new Title({text: r`$$\text{Right: } ${tex}$$`, ...attrs}), "right")

        p.add_layout(new Title({text: "1st Above (Ag/9)", ...attrs}), "above")
        p.add_layout(new Title({text: "Second Above (Ag/9)\nspanning two lines", ...attrs}), "above")
        p.add_layout(new Title({text: r`$$\text{Above: } ${tex}$$`, ...attrs}), "above")

        p.add_layout(new Title({text: "1st Below (Ag/9)", ...attrs}), "below")
        p.add_layout(new Title({text: "Second Below (Ag/9)\nspanning two lines", ...attrs}), "below")
        p.add_layout(new Title({text: r`$$\text{Below: } ${tex}$$`, ...attrs}), "below")

        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      return row([p0, p1])
    }

    for (const align of TextAlign) {
      it(`with align=${align}`, async () => {
        const p = plot({align})
        await display(p)
      })

      it(`with align=${align} and border_line and background_fill`, async () => {
        const p = plot({align, border_line_color: "black", background_fill_color: "lightgray"})
        await display(p)
      })

      it(`with align=${align} and border_line and background_hatch and padding and border_radius`, async () => {
        const p = plot({
          align,
          border_line_color: "black",
          background_hatch_color: "lightgray", background_hatch_pattern: "/",
          padding: 5,
          border_radius: 6,
        })
        await display(p)
      })

      it(`with align=${align} and offset=20 and border_line and background_fill`, async () => {
        const p = plot({align, offset: 20, border_line_color: "black", background_fill_color: "lightgray"})
        await display(p)
      })

      it(`with align=${align} and standoff=20 and border_line and background_fill`, async () => {
        const p = plot({align, standoff: 20, border_line_color: "black", background_fill_color: "lightgray"})
        await display(p)
      })
    }
  })
})
