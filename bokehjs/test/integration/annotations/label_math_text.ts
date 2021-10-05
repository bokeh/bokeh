import {display, fig} from "../_util"
import {with_internal, with_delayed, with_none} from "../_util"

import {Label, TeX, Ascii, MathML} from "@bokehjs/models"
import {tex, ascii, mathml} from "./_text_utils"

describe("Label annotation", () => {

  describe("with MathText", () => {
    function plot_label(attrs: Partial<Label.Attrs>) {
      const plot = fig([300, 100], {x_range: [-5, 5], y_range: [-5, 5]})

      const label0 = new Label({
        x: 0, y: 0,
        text_align: "center", text_baseline: "middle",
        ...attrs,
      })
      plot.add_layout(label0)

      return plot
    }

    it("should support Ascii notation", async () => {
      await with_internal(async () => {
        const p = plot_label({text: new Ascii({text: ascii})})
        await display(p)
      })
    })

    it("should support MathML notation", async () => {
      await with_internal(async () => {
        const p = plot_label({text: new MathML({text: mathml})})
        await display(p)
      })
    })

    it("should support LaTeX notation with a delay in loading", async () => {
      await with_delayed(async () => {
        const p = plot_label({text: new TeX({text: tex})})
        await display(p)
      })
    })

    it("should fallback to text if MathJax provider is not available", async () => {
      await with_none(async () => {
        const p = plot_label({text: new TeX({text: tex})})
        await display(p)
      })
    })
  })
})
