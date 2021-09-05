import sinon from "sinon"

import {display} from "./_util"

import {
  LinearAxis, LogAxis, CategoricalAxis, LinearScale, LogScale, CategoricalScale, Range1d, FactorRange,
  Plot, AllLabels, NoOverlap, TeX, Ascii, MathML,
} from "@bokehjs/models"
import {Factor} from "@bokehjs/models/ranges/factor_range"
import {Side} from "@bokehjs/core/enums"
import {radians} from "@bokehjs/core/util/math"
import {MathTextView} from "@bokehjs/models/text/math_text"
import {NoProvider, MathJaxProvider} from "@bokehjs/models/text/providers"
import {tex2svg, mathml2svg} from "@bokehjs/models/text/mathjax"
import {wait} from "@bokehjs/core/util/defer"

export class InternalProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {tex2svg, mathml2svg} : null
  }
  async fetch() {
    this.status = "loaded"
  }
}

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

(() => {
  type PlotFn = (attrs: Partial<LinearAxis.Attrs>, options?: {minor_size?: number, num_ticks?: number}) => Promise<void>

  function hplot(side: Side, axis_type: "linear" | "log"): PlotFn {
    return async (attrs, options) => {
      const p = new Plot({
        width: 300,
        height: options?.minor_size ?? 50,
        x_scale: axis_type == "linear" ? new LinearScale() : new LogScale(),
        y_scale: new LinearScale(),
        x_range: axis_type == "linear" ? new Range1d({start: 100, end: 200}) : new Range1d({start: 10**-2, end: 10**11}),
        y_range: new Range1d({start: 0, end: 1}),
        min_border_top: 0,
        min_border_bottom: 0,
        min_border_left: 20,
        min_border_right: 20,
        title: null,
        toolbar_location: null,
      })

      const axis = axis_type == "linear" ? new LinearAxis(attrs) : new LogAxis(attrs)

      if (options?.num_ticks != null)
        axis.ticker.desired_num_ticks = options.num_ticks

      p.add_layout(axis, side)
      await display(p)
    }
  }

  function vplot(side: Side, axis_type: "linear" | "log"): PlotFn {
    return async (attrs, options) => {
      const p = new Plot({
        width: options?.minor_size ?? 50,
        height: 300,
        x_scale: new LinearScale(),
        y_scale: axis_type == "linear" ? new LinearScale() : new LogScale(),
        x_range: new Range1d({start: 0, end: 1}),
        y_range: axis_type == "linear" ? new Range1d({start: 100, end: 200}) : new Range1d({start: 10**-2, end: 10**11}),
        min_border_top: 20,
        min_border_bottom: 20,
        min_border_left: 0,
        min_border_right: 0,
        title: null,
        toolbar_location: null,
      })
      const axis = axis_type == "linear" ? new LinearAxis(attrs) : new LogAxis(attrs)
      if (options?.num_ticks != null)
        axis.ticker.desired_num_ticks = options.num_ticks
      p.add_layout(axis, side)
      await display(p)
    }
  }

  function test(plot: PlotFn) {
    it("should support major_label_orientation=horizontal", async () => {
      await plot({major_label_orientation: "horizontal"})
    })

    it("should support major_label_orientation=vertical", async () => {
      await plot({major_label_orientation: "vertical"})
    })

    it("should support major_label_orientation=parallel", async () => {
      await plot({major_label_orientation: "parallel"})
    })

    it("should support major_label_orientation=normal", async () => {
      await plot({major_label_orientation: "normal"})
    })

    it("should support major_label_orientation=0deg", async () => {
      await plot({major_label_orientation: radians(0)})
    })

    it("should support major_label_orientation=30deg", async () => {
      await plot({major_label_orientation: radians(30)})
    })

    it("should support major_label_orientation=45deg", async () => {
      await plot({major_label_orientation: radians(45)})
    })

    it("should support major_label_orientation=60deg", async () => {
      await plot({major_label_orientation: radians(60)})
    })

    it("should support major_label_orientation=90deg", async () => {
      await plot({major_label_orientation: radians(90)})
    })

    it("should support major_label_orientation=135deg", async () => {
      await plot({major_label_orientation: radians(135)})
    })

    it("should support major_label_orientation=180deg", async () => {
      await plot({major_label_orientation: radians(180)})
    })

    it("should support major_label_standoff=20", async () => {
      await plot({major_label_standoff: 20})
    })

    it("should support major_tick_in=10", async () => {
      await plot({major_tick_in: 10})
    })

    it("should support major_tick_out=10", async () => {
      await plot({major_tick_out: 10})
    })

    it("should support minor_tick_in=10", async () => {
      await plot({minor_tick_in: 10})
    })

    it("should support minor_tick_out=10", async () => {
      await plot({minor_tick_out: 10})
    })

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

    it("should support LaTeX notation on axis_label and tick labels with MathText", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        await plot({
          axis_label: new TeX({text: tex}),
          major_label_overrides: {
            100: new TeX({text: "-3\\sigma"}),
            120: new TeX({text: "-2\\sigma"}),
            140: new TeX({text: "-1\\sigma"}),
            160: new TeX({text: "\\mu"}),
            180: new TeX({text: "1\\sigma"}),
            200: new TeX({text: "2\\sigma"}),
            1: "one",
            0.01: new TeX({text: "\\frac{0.133}{\\mu+2\\sigma^2}"}),
            10000: new TeX({text: "10 \\ast 1000"}),
            1000000: new TeX({text: "\\sigma^2"}),
          },
        },{minor_size: 100})
      } finally {
        stub.restore()
      }
    })

    it("should support LaTeX notation on axis_label with MathText", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        await plot({axis_label: new TeX({text: tex})}, {minor_size: 100})
      } finally {
        stub.restore()
      }
    })

    it("should support Ascii notation on axis_label with MathText", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        await plot({axis_label: new Ascii({text: ascii})}, {minor_size: 100})
      } finally {
        stub.restore()
      }
    })

    it("should support MathML notation on axis_label with MathText", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        await plot({axis_label: new MathML({text: mathml})}, {minor_size: 100})
      } finally {
        stub.restore()
      }
    })

    it("should support LaTeX notation on axis_label with MathText and a delay in loading", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new DelayedInternalProvider())
      try {
        await plot({axis_label: new TeX({text: tex})}, {minor_size: 100})
      } finally {
        stub.restore()
      }
    })

    it("should support LaTeX notation on axis_label with MathText and fallback to text if MathJax has errors", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new NoProvider())
      try {
        await plot({axis_label: new TeX({text: tex})}, {minor_size: 100})
      } finally {
        stub.restore()
      }
    })

    it("should display tick labels with MathText on overrides", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        await plot({
          major_label_overrides: {
            100: new TeX({text: "-3\\sigma"}),
            120: new TeX({text: "-2\\sigma"}),
            140: new TeX({text: "-1\\sigma"}),
            160: new TeX({text: "\\mu"}),
            180: new TeX({text: "1\\sigma"}),
            200: new TeX({text: "2\\sigma"}),
            1: "one",
            0.01: new TeX({text: "\\frac{0.133}{\\mu+2\\sigma^2}"}),
            10000: new TeX({text: "10 \\ast 1000"}),
            1000000: new TeX({text: "\\sigma^2"}),
          },
        }, {minor_size: 160})
      } finally {
        stub.restore()
      }
    })

    it("should support single line axis_label", async () => {
      await plot({axis_label: "This is an axis label"}, {minor_size: 100})
    })

    it("should support single line axis_label and axis_label_standoff=20", async () => {
      await plot({axis_label: "This is an axis label", axis_label_standoff: 20}, {minor_size: 100})
    })

    const multiline_axis_label = "This is an axis label\nthat spans\nexactly three lines"

    it("should support multiple line axis_label with axis_label_text_align=left", async () => {
      await plot({axis_label: multiline_axis_label, axis_label_text_align: "left"}, {minor_size: 100})
    })

    it("should support multiple line axis_label with axis_label_text_align=center", async () => {
      await plot({axis_label: multiline_axis_label, axis_label_text_align: "center"}, {minor_size: 100})
    })

    it("should support multiple line axis_label with axis_label_text_align=right", async () => {
      await plot({axis_label: multiline_axis_label, axis_label_text_align: "right"}, {minor_size: 100})
    })

    it("should support major_label_policy=AllLables with major_label_orientation=parallel", async () => {
      await plot({major_label_policy: new AllLabels(), major_label_orientation: "parallel"}, {num_ticks: 20})
    })

    it("should support major_label_policy=NoOverlap(min_distance=10) with major_label_orientation=parallel", async () => {
      await plot({major_label_policy: new NoOverlap({min_distance: 10}), major_label_orientation: "parallel"}, {num_ticks: 20})
    })

    it("should support major_label_policy=NoOverlap(min_distance=50) with major_label_orientation=parallel", async () => {
      await plot({major_label_policy: new NoOverlap({min_distance: 50}), major_label_orientation: "parallel"}, {num_ticks: 20})
    })

    it("should support major_label_policy=AllLables with major_label_orientation=normal", async () => {
      await plot({major_label_policy: new AllLabels(), major_label_orientation: "normal"}, {num_ticks: 20})
    })

    it("should support major_label_policy=NoOverlap(min_distance=10) with major_label_orientation=normal", async () => {
      await plot({major_label_policy: new NoOverlap({min_distance: 10}), major_label_orientation: "normal"}, {num_ticks: 20})
    })

    it("should support major_label_policy=NoOverlap(min_distance=50) with major_label_orientation=normal", async () => {
      await plot({major_label_policy: new NoOverlap({min_distance: 50}), major_label_orientation: "normal"}, {num_ticks: 20})
    })
  }

  describe("LinearAxis", () => {
    describe("in horizontal orientation", () => {
      describe("above a plot", () => test(hplot("above", "linear")))
      describe("below a plot", () => test(hplot("below", "linear")))
    })

    describe("in vertical orientation", () => {
      describe("left of a plot", () => test(vplot("left", "linear")))
      describe("right of a plot", () => test(vplot("right", "linear")))
    })
  })

  describe("LogAxis", () => {
    describe("in horizontal orientation", () => {
      describe("above a plot", () => test(hplot("above", "log")))
      describe("below a plot", () => test(hplot("below", "log")))
    })

    describe("in vertical orientation", () => {
      describe("left of a plot", () => test(vplot("left", "log")))
      describe("right of a plot", () => test(vplot("right", "log")))
    })
  })
})()

describe("CategoricalAxis", () => {
  type PlotFn = (factors: Factor[], attrs: Partial<CategoricalAxis.Attrs>, options?: {minor_size?: number}) => Promise<void>

  function hplot(side: Side): PlotFn {
    return async (factors, attrs, options) => {
      const p = new Plot({
        width: 300,
        height: options?.minor_size ?? 50,
        x_scale: new CategoricalScale(),
        y_scale: new LinearScale(),
        x_range: new FactorRange({factors}),
        y_range: new Range1d({start: 0, end: 1}),
        min_border_top: 0,
        min_border_bottom: 0,
        min_border_left: 20,
        min_border_right: 20,
        title: null,
        toolbar_location: null,
      })
      const axis = new CategoricalAxis(attrs)
      p.add_layout(axis, side)
      await display(p)
    }
  }

  function vplot(side: Side): PlotFn {
    return async (factors, attrs, options) => {
      const p = new Plot({
        width: options?.minor_size ?? 50,
        height: 300,
        x_scale: new LinearScale(),
        y_scale: new CategoricalScale(),
        x_range: new Range1d({start: 0, end: 1}),
        y_range: new FactorRange({factors}),
        min_border_top: 20,
        min_border_bottom: 20,
        min_border_left: 0,
        min_border_right: 0,
        title: null,
        toolbar_location: null,
      })
      const axis = new CategoricalAxis(attrs)
      p.add_layout(axis, side)
      await display(p)
    }
  }

  function inner_test(factors: Factor[], plot: PlotFn, minor_size: number) {
    it("with major_label_orientation=horizontal", async () => {
      await plot(factors, {major_label_orientation: "horizontal"}, {minor_size})
    })

    it("with major_label_orientation=vertical", async () => {
      await plot(factors, {major_label_orientation: "vertical"}, {minor_size})
    })

    it("with major_label_orientation=parallel", async () => {
      await plot(factors, {major_label_orientation: "parallel"}, {minor_size})
    })

    it("with major_label_orientation=normal", async () => {
      await plot(factors, {major_label_orientation: "normal"}, {minor_size})
    })

    it("with major_label_orientation=0deg", async () => {
      await plot(factors, {major_label_orientation: radians(0)}, {minor_size})
    })

    it("with major_label_orientation=30deg", async () => {
      await plot(factors, {major_label_orientation: radians(30)}, {minor_size})
    })

    it("with major_label_orientation=45deg", async () => {
      await plot(factors, {major_label_orientation: radians(45)}, {minor_size})
    })

    it("with major_label_orientation=60deg", async () => {
      await plot(factors, {major_label_orientation: radians(60)}, {minor_size})
    })

    it("with major_label_orientation=90deg", async () => {
      await plot(factors, {major_label_orientation: radians(90)}, {minor_size})
    })
  }

  function test(plot: PlotFn) {
    describe("should support single line factors", () => {
      const factors = ["foo", "bar", "baz", "qux", "quux", "corge"]
      inner_test(factors, plot, 50)
    })

    describe("should support multiple line factors", () => {
      const factors = ["foo bar\nbaz qux", "foo", "foo\nbar\nbaz\nqux", "foo bar baz\nqux", "quux", "foo bar\nbaz\nqux\nquux corge"]
      inner_test(factors, plot, 100)
    })
  }

  describe("in horizontal orientation", () => {
    describe("above a plot", () => test(hplot("above")))
    describe("below a plot", () => test(hplot("below")))
  })

  describe("in vertical orientation", () => {
    describe("left of a plot", () => test(vplot("left")))
    describe("right of a plot", () => test(vplot("right")))
  })
})
