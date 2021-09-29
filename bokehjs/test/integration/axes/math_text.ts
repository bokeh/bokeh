import sinon from "sinon"

import {wait} from "@bokehjs/core/util/defer"

import {Side} from "@bokehjs/core/enums"
import {tex2svg, mathml2svg} from "@bokehjs/models/text/mathjax"
import {MathTextView} from "@bokehjs/models/text/math_text"
import {MathJaxProvider, NoProvider} from "@bokehjs/models/text/providers"
import {
  LinearAxis,
  Plot,
  TeX,
  Ascii,
  MathML,
  LinearScale,
  Range1d,
  LogScale,
  LogAxis,
} from "@bokehjs/models"

import {display} from "../_util"

export class DelayedInternalProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {tex2svg, mathml2svg} : null
  }

  async fetch() {
    this.status = "loading"
    wait(50).then(() => {
      this.status = "loaded"
      this.ready.emit()
    })
  }
}

export class InternalProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {tex2svg, mathml2svg} : null
  }
  async fetch() {
    this.status = "loaded"
  }
}

describe("MathText on axes", () => {
  const tex = "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"

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

  function plotAxis(attrs: Partial<LinearAxis.Attrs>, width = 300, height = 100) {
    const p = new Plot({
      width,
      height,
      x_scale: new LinearScale(),
      x_range: new Range1d({start: 100, end: 200}),
      y_scale: new LinearScale(),
      y_range: new Range1d({start: 100, end: 200}),
      min_border_top: 0,
      min_border_bottom: 0,
      min_border_left: 20,
      min_border_right: 20,
      title: null,
      toolbar_location: null,
    })

    const axis = new LinearAxis(attrs)
    p.add_layout(axis, "above")
    return display(p)
  }

  it("should support LaTeX with MathText and a delay in loading", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new DelayedInternalProvider())
    try {
      await plotAxis({axis_label: new TeX({text: tex})})
    } finally {
      stub.restore()
    }
  })

  it("should support Ascii notation on axis_label with MathText", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plotAxis({axis_label: new Ascii({text: ascii})})
    } finally {
      stub.restore()
    }
  })

  it("should support MathML notation on axis_label with MathText", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plotAxis({axis_label: new MathML({text: mathml})})
    } finally {
      stub.restore()
    }
  })

  it("should support LaTeX notation on axis_label with MathText and fallback to text if MathJax has errors", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new NoProvider())
    try {
      await plotAxis({axis_label: new TeX({text: tex})})
    } finally {
      stub.restore()
    }
  })
  type PlotFn = (
    attrs: Partial<LinearAxis.Attrs>
  ) => Promise<void>

  function hplot(side: Side): PlotFn {
    return async (attrs) => {
      const p = new Plot({
        width: 300,
        height: 100,
        x_scale: new LogScale(),
        y_scale: new LinearScale(),
        x_range: new Range1d({start: 10 ** -2, end: 10 ** 11}),
        y_range: new Range1d({start: 0, end: 1}),
        min_border_top: 0,
        min_border_bottom: 0,
        min_border_left: 20,
        min_border_right: 20,
        title: null,
        toolbar_location: null,
      })

      const axis = new LogAxis(attrs)
      p.add_layout(axis, side)
      await display(p)
    }
  }

  function vplot(side: Side): PlotFn {
    return async (attrs) => {
      const p = new Plot({
        width: 160,
        height: 300,
        x_scale: new LinearScale(),
        y_scale: new LogScale(),
        x_range: new Range1d({start: 0, end: 1}),
        y_range: new Range1d({start: 10 ** -2, end: 10 ** 11}),
        min_border_top: 20,
        min_border_bottom: 20,
        min_border_left: 0,
        min_border_right: 0,
        title: null,
        toolbar_location: null,
      })

      const axis = new LogAxis(attrs)
      p.add_layout(axis, side)
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

    it.allowing(4)("should display tick labels with math text on overrides", async () => {
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

  describe("MathText on each side of a plot", () => {
    describe("in horizontal orientation", () => {
      describe("above a plot", () => test(hplot("above")))
      describe("below a plot", () => test(hplot("below")))
    })

    describe("in vertical orientation", () => {
      describe("left of a plot", () => test(vplot("left")))
      describe("right of a plot", () => test(vplot("right")))
    })
  })
})
