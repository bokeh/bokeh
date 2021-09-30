import sinon from "sinon"

import {DelayedInternalProvider, display, fig, InternalProvider} from "../_util"

import {Title, Label} from "@bokehjs/models/annotations"
import {MathTextView, TeX, Ascii, MathML} from "@bokehjs/models/text/math_text"
import {NoProvider} from "@bokehjs/models/text/providers"

describe("MathText on TextAnnotations", () => {
  const tex = "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
  const text = `$$${tex}$$`

  const ascii = "x = (-b +- sqrt(b^2 - 4ac)) / (2a)"

  const mathml = `
  <math>
      <mrow>
          <mi>x</mi>
          <mo>=</mo>
          <mfrac>
              <mrow>
              <mrow>
                  <mo>-</mo>
                  <mi>b</mi>
              </mrow>
              <mo>&#xB1;<!--PLUS-MINUS SIGN--></mo>
              <msqrt>
                  <mrow>
                  <msup>
                      <mi>b</mi>
                      <mn>2</mn>
                  </msup>
                  <mo>-</mo>
                  <mrow>
                      <mn>4</mn>
                      <mo>&#x2062;</mo>
                      <mi>a</mi>
                      <mo>&#x2062;</mo>
                      <mi>c</mi>
                  </mrow>
                  </mrow>
              </msqrt>
              </mrow>
              <mrow>
              <mn>2</mn>
              <mo>&#x2062;<!--INVISIBLE TIMES--></mo>
              <mi>a</mi>
              </mrow>
          </mfrac>
      </mrow>
  </math>
  `

  describe("on Titles", () => {
    function plot(attrs: Partial<Title.Attrs>) {
      const p = fig([400, 400], {
        x_axis_type: null,
        y_axis_type: null,
        x_range: [0, 1],
        y_range: [0, 1],
      })

      p.add_layout(new Title({text, ...attrs}), "left")
      p.add_layout(new Title({text, ...attrs}), "right")
      p.add_layout(new Title({text, ...attrs}), "above")
      p.add_layout(new Title({text, ...attrs}), "below")

      return p
    }

    describe("with basic aligns", () => {
      it("with align=left", async () => {
        const p = plot({align: "left"})
        await display(p)
      })

      it("with align=center", async () => {
        const p = plot({align: "center"})
        await display(p)
      })

      it("with align=right", async () => {
        const p = plot({align: "right"})
        await display(p)
      })
    })
  })

  describe("on Labels", () => {
    function plot() {
      const plot = fig([600, 600], {x_range: [0, 10], y_range: [0, 10]})

      const label0 = new Label({
        x: 1,
        y: 6,
        x_offset: 0,
        y_offset: 0,
        angle: 15,
        angle_units: "deg",
        text,
        text_font_size: "36px",
        text_color: "red",
        text_alpha: 0.9,
        text_baseline: "bottom",
        text_align: "left",
        background_fill_color: "green",
        background_fill_alpha: 0.2,
        border_line_color: "blue",
        border_line_width: 2,
        border_line_dash: [8, 4],
      })

      const label1 = new Label({
        x: 1,
        y: 6,
        x_offset: 25,
        y_offset: -50,
        angle: 15,
        angle_units: "deg",
        text,
        text_font_size: "36px",
        text_color: "red",
        text_alpha: 0.9,
        text_baseline: "bottom",
        text_align: "left",
        background_fill_color: "green",
        background_fill_alpha: 0.2,
        border_line_color: "blue",
        border_line_width: 2,
        border_line_dash: [8, 4],
      })

      const label2 = new Label({
        x: 4,
        y: 2,
        text,
        text_font_size: "26px",
        text_baseline: "top",
        text_align: "right",
        border_line_color: "blue",
        border_line_width: 1,
        border_line_dash: [10, 2, 8, 2, 4, 2],
      })

      const label3 = new Label({
        x: 4,
        y: 1,
        text,
        text_font_size: "26px",
        text_baseline: "top",
        text_align: "left",
        border_line_color: "blue",
        border_line_width: 1,
        border_line_dash: [10, 2, 8, 2, 4, 2],
      })

      const label4 = new Label({
        x: 8,
        y: 4,
        angle: 0.25,
        angle_units: "turn",
        text,
        text_font_size: "26px",
        text_baseline: "top",
        text_align: "right",
        border_line_color: "blue",
        border_line_width: 1,
        border_line_dash: [10, 2, 8, 2, 4, 2],
      })

      const label5 = new Label({
        x: 9,
        y: 4,
        angle: 0.25,
        angle_units: "turn",
        text,
        text_font_size: "26px",
        text_baseline: "top",
        text_align: "left",
        border_line_color: "blue",
        border_line_width: 1,
        border_line_dash: [10, 2, 8, 2, 4, 2],
      })

      const label6 = new Label({
        x: 4,
        y: 4,
        angle: -15,
        angle_units: "deg",
        text,
        text_font_size: "16px",
        text_baseline: "top",
        text_align: "left",
        background_fill_color: "orange",
        border_line_color: "blue",
        border_line_width: 1,
        border_line_dash: [10, 2, 8, 2, 4, 2],
      })

      const label_above_0 = new Label({
        x: 0,
        y: 0,
        x_units: "screen",
        y_units: "screen",
        text,
        text_font_size: "30px",
        text_color: "firebrick",
        text_alpha: 0.9,
        background_fill_color: "aquamarine",
        border_line_color: "green",
        border_line_width: 1,
        border_line_dash: [8, 4],
      })

      const label_above_1 = new Label({
        x: 0,
        y: 0,
        x_units: "screen",
        y_units: "screen",
        text,
        text_font_size: "30px",
        text_color: "firebrick",
        text_alpha: 0.9,
        background_fill_color: "lightgreen",
        border_line_color: "green",
        border_line_width: 1,
        border_line_dash: [8, 4],
      })

      const label_below_0 = new Label({
        x: 0,
        y: 0,
        x_units: "screen",
        y_units: "screen",
        text,
        text_font_size: "30px",
        text_color: "firebrick",
        text_alpha: 0.9,
        background_fill_color: "aquamarine",
        border_line_color: "green",
        border_line_width: 1,
        border_line_dash: [8, 4],
      })

      const label_below_1 = new Label({
        x: 0,
        y: 0,
        x_units: "screen",
        y_units: "screen",
        text,
        text_font_size: "30px",
        text_color: "firebrick",
        text_alpha: 0.9,
        background_fill_color: "lightgreen",
        border_line_color: "green",
        border_line_width: 1,
        border_line_dash: [8, 4],
      })

      const label_left_0 = new Label({
        x: 0,
        y: 0,
        x_units: "screen",
        y_units: "screen",
        angle: 90,
        angle_units: "deg",
        text,
        text_font_size: "30px",
        text_color: "firebrick",
        text_alpha: 0.9,
        text_baseline: "top",
        background_fill_color: "aquamarine",
        border_line_color: "green",
        border_line_width: 1,
        border_line_dash: [8, 4],
      })

      const label_left_1 = new Label({
        x: 0,
        y: 0,
        x_units: "screen",
        y_units: "screen",
        angle: 90,
        angle_units: "deg",
        text,
        text_font_size: "30px",
        text_color: "firebrick",
        text_alpha: 0.9,
        text_baseline: "top",
        background_fill_color: "lightgreen",
        border_line_color: "green",
        border_line_width: 1,
        border_line_dash: [8, 4],
      })

      const label_right_0 = new Label({
        x: 0,
        y: 0,
        x_units: "screen",
        y_units: "screen",
        angle: 90,
        angle_units: "deg",
        text,
        text_font_size: "30px",
        text_color: "firebrick",
        text_alpha: 0.9,
        text_baseline: "top",
        background_fill_color: "aquamarine",
        border_line_color: "green",
        border_line_width: 1,
        border_line_dash: [8, 4],
      })

      const label_right_1 = new Label({
        x: 0,
        y: 0,
        x_units: "screen",
        y_units: "screen",
        angle: 90,
        angle_units: "deg",
        text,
        text_font_size: "30px",
        text_color: "firebrick",
        text_alpha: 0.9,
        text_baseline: "top",
        background_fill_color: "lightgreen",
        border_line_color: "green",
        border_line_width: 1,
        border_line_dash: [8, 4],
      })

      plot.add_layout(label0)
      plot.add_layout(label1)
      plot.add_layout(label2)
      plot.add_layout(label3)
      plot.add_layout(label4)
      plot.add_layout(label5)
      plot.add_layout(label6)
      plot.add_layout(label_above_0, "above")
      plot.add_layout(label_above_1, "above")
      plot.add_layout(label_below_0, "below")
      plot.add_layout(label_below_1, "below")
      plot.add_layout(label_left_0, "left")
      plot.add_layout(label_left_1, "left")
      plot.add_layout(label_right_0, "right")
      plot.add_layout(label_right_1, "right")

      return plot
    }

    it("with basic positioning", async () => {
      await display(plot())
    })

    describe("with MathText caveats", () => {
      function plot_label(attrs: Partial<Label.Attrs>) {
        const plot = fig([600, 600], {x_range: [0, 10], y_range: [0, 10]})

        const label0 = new Label({
          x: 0, y: 0,
          x_units: "screen", y_units: "screen",
          ...attrs,
        })

        plot.add_layout(label0)

        return plot
      }

      it("should support LaTeX with delay in loading", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new DelayedInternalProvider())
        try {
          const p = plot_label({text: new TeX({text: tex})})
          await display(p)
        } finally {
          stub.restore()
        }
      })

      it("should support Ascii notation", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())
        try {
          const p = plot_label({text: new Ascii({text: ascii})})
          await display(p)
        } finally {
          stub.restore()
        }
      })

      it("should support MathML notation", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())
        try {
          const p = plot_label({text: new MathML({text: mathml})})
          await display(p)
        } finally {
          stub.restore()
        }
      })

      it("should fallback to text if MathJax has errors", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new NoProvider())
        try {
          const p = plot_label({text: new TeX({text: tex})})
          await display(p)
        } finally {
          stub.restore()
        }
      })
    })
  })
})
