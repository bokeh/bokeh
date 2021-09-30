import sinon from "sinon"

import {MathTextView, TeX} from "@bokehjs/models/text/math_text"
import {
  Plot,
  Range1d,
  LogScale,
  LogAxis,
} from "@bokehjs/models"

import {display, InternalProvider} from "../_util"

describe("MathText on axes", () => {
  const tex = "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"

  type PlotFn = (
    attrs: Partial<LogAxis.Attrs>
  ) => Promise<void>

  function plotAxis(): PlotFn {
    return async (attrs) => {
      const p = new Plot({
        width: 300,
        height: 300,
        x_scale: new LogScale(),
        y_scale: new LogScale(),
        x_range: new Range1d({start: 10 ** -2, end: 10 ** 11}),
        y_range: new Range1d({start: 10 ** -2, end: 10 ** 11}),
        min_border_top: 20,
        min_border_bottom: 20,
        min_border_left: 0,
        min_border_right: 0,
        title: null,
        toolbar_location: null,
      })

      p.add_layout(new LogAxis(attrs), "left")
      p.add_layout(new LogAxis(attrs), "right")
      p.add_layout(new LogAxis(attrs), "above")
      p.add_layout(new LogAxis(attrs), "below")
      await display(p)
    }
  }

  function test(plot: PlotFn) {
    it("should support LaTeX notation on axis_label with MathText", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        await plot({axis_label: new TeX({text: tex})})
      } finally {
        stub.restore()
      }
    })

    it("should display tick labels with math text on overrides", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        await plot({
          major_label_overrides: {
            1: "one",
            0.01: new TeX({text: "\\frac{0.133}{\\mu+2\\sigma^2}"}),
            10000: new TeX({text: "10 \\ast 1000"}),
            1000000: new TeX({text: "\\sigma^2"}),
          },
        })
      } finally {
        stub.restore()
      }
    })
  }

  describe("MathText on each side of a plot", () => test(plotAxis()))
})
