import {Side} from "@bokehjs/core/enums"
import {wait} from "@bokehjs/core/util/defer"
import {
  Ascii,
  LinearAxis,
  LinearScale,
  LogAxis,
  LogScale,
  MathML,
  PlainText,
  Plot,
  Range1d,
  TeX,
} from "@bokehjs/models"
import {mathml2svg, tex2svg} from "@bokehjs/models/text/mathjax"
import {MathTextView} from "@bokehjs/models/text/math_text"
import {MathJaxProvider, NoProvider} from "@bokehjs/models/text/providers"
import sinon from "sinon"
import {display} from "./_util"

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
  type PlotFn = (
    attrs: Partial<LinearAxis.Attrs>,
    options?: { minor_size?: number, major_size?: number, num_ticks?: number, plot_attrs?: Partial<Plot.Attrs> }
  ) => Promise<void>

  function hplot(side: Side, axis_type: "linear" | "log"): PlotFn {
    return async (attrs, options) => {
      const p = new Plot({
        width: options?.major_size ?? 300,
        height: options?.minor_size ?? 50,
        x_scale: axis_type == "linear" ? new LinearScale() : new LogScale(),
        y_scale: new LinearScale(),
        x_range:
          axis_type == "linear"
            ? new Range1d({start: 100, end: 200})
            : new Range1d({start: 10 ** -2, end: 10 ** 11}),
        y_range: new Range1d({start: 0, end: 1}),
        min_border_top: 0,
        min_border_bottom: 0,
        min_border_left: 20,
        min_border_right: 20,
        title: null,
        toolbar_location: null,
        ...options?.plot_attrs,
      })

      const axis =
        axis_type == "linear" ? new LinearAxis(attrs) : new LogAxis(attrs)

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
        height: options?.major_size ?? 300,
        x_scale: new LinearScale(),
        y_scale: axis_type == "linear" ? new LinearScale() : new LogScale(),
        x_range: new Range1d({start: 0, end: 1}),
        y_range:
          axis_type == "linear"
            ? new Range1d({start: 100, end: 200})
            : new Range1d({start: 10 ** -2, end: 10 ** 11}),
        min_border_top: 20,
        min_border_bottom: 20,
        min_border_left: 0,
        min_border_right: 0,
        title: null,
        toolbar_location: null,
      })
      const axis =
        axis_type == "linear" ? new LinearAxis(attrs) : new LogAxis(attrs)
      if (options?.num_ticks != null)
        axis.ticker.desired_num_ticks = options.num_ticks
      p.add_layout(axis, side)
      await display(p)
    }
  }

  describe("models with MathText", () => {
    const mathjax_example =
      "When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$"
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

    describe("on tick labels", () => {
      const major_label_overrides = {
        major_label_overrides: {
          0: new TeX({text: "\\frac{0}{0}"}),
          2: new TeX({text: "zero"}),
          4: new TeX({text: "Ten()"}),
          6: new TeX({text: "0"}),
          8: new TeX({text: "Ten"}),
          10: "Ten",
        },
      }
      const options = {
        minor_size: 50,
        plot_attrs: {
          x_range: new Range1d({start: 0, end: 10}),
          y_range: new Range1d({start: 0, end: 10}),
        },
      }
      it("on linear scale ticks above a plot", async () => {
        const plot_fn = hplot("above", "linear")
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())

        try {
          await plot_fn(major_label_overrides, options)
        } finally {
          stub.restore()
        }
      })
      it("in horizontal orientation below a plot", async () => {
        const plot_fn = hplot("below", "linear")
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())

        try {
          await plot_fn(major_label_overrides, options)
        } finally {
          stub.restore()
        }
      })
      it("on linear scale ticks left of a plot", async () => {
        const plot_fn = vplot("left", "linear")
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())

        try {
          await plot_fn(major_label_overrides, options)
        } finally {
          stub.restore()
        }
      })
      it("in vertical orientation right of a plot", async () => {
        const plot_fn = vplot("right", "linear")
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())

        try {
          await plot_fn(major_label_overrides, options)
        } finally {
          stub.restore()
        }
      })

      it("on log scale ticks", async () => {
        const plot_fn = hplot("above", "log")
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())
        try {
          await plot_fn(
            {
              major_label_overrides: {
                0.01: new TeX({text: "\\frac{0.133}{\\mu+2\\sigma^2}"}),
                1: "one",
                10000: new TeX({text: "10 \\ast 1000"}),
                1000000: new TeX({text: "\\sigma^2"}),
              },
            },
            {minor_size: 50}
          )
        } finally {
          stub.restore()
        }
      })
    })

    describe("on axis labels", () => {
      it("should divide mathstring into tex/plaintext parts", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())
        try {
          await hplot("above", "linear")(
            {axis_label: mathjax_example},
            {major_size: 600, minor_size: 100}
          )
        } finally {
          stub.restore()
        }
      })

      it("should divide mathstring into tex/plaintext parts below", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())
        try {
          await hplot("below", "linear")(
            {axis_label: mathjax_example},
            {major_size: 600, minor_size: 100}
          )
        } finally {
          stub.restore()
        }
      })

      it("should ignore LaTeX notation on axis_label using PlainText", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())
        try {
          await hplot("above", "linear")(
            {axis_label: new PlainText({text: `$${tex}$`})},
            {minor_size: 100}
          )
        } finally {
          stub.restore()
        }
      })

      it("should support LaTeX notation on axis_label with MathText", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())
        try {
          await hplot("above", "linear")(
            {axis_label: new TeX({text: tex})},
            {minor_size: 100}
          )
        } finally {
          stub.restore()
        }
      })

      it("should support Ascii notation on axis_label with MathText", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())
        try {
          await hplot("above", "linear")(
            {axis_label: new Ascii({text: ascii})},
            {minor_size: 100}
          )
        } finally {
          stub.restore()
        }
      })

      it("should support MathML notation on axis_label with MathText", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new InternalProvider())
        try {
          await hplot("above", "linear")(
            {axis_label: new MathML({text: mathml})},
            {minor_size: 100}
          )
        } finally {
          stub.restore()
        }
      })

      it("should support LaTeX notation on axis_label with MathText and a delay in loading", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new DelayedInternalProvider())
        try {
          await hplot("above", "linear")(
            {axis_label: new TeX({text: tex})},
            {minor_size: 100}
          )
        } finally {
          stub.restore()
        }
      })

      it("should support LaTeX notation on axis_label with MathText and fallback to text if MathJax has errors", async () => {
        const stub = sinon.stub(MathTextView.prototype, "provider")
        stub.value(new NoProvider())
        try {
          await hplot("above", "linear")(
            {axis_label: new TeX({text: tex})},
            {minor_size: 100}
          )
        } finally {
          stub.restore()
        }
      })
    })
  })
})()
