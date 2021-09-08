import {Side} from "@bokehjs/core/enums"
import {wait} from "@bokehjs/core/util/defer"
import {Ascii, LinearAxis, LinearScale, LogAxis, LogScale, MathML, PlainText, Plot, Range1d, TeX} from "@bokehjs/models"
import {mathml2svg, tex2svg} from "@bokehjs/models/text/mathjax"
import {MathTextView} from "@bokehjs/models/text/math_text"
import {MathJaxProvider, NoProvider} from "@bokehjs/models/text/providers"
import sinon from "sinon"
import {display} from "./_util"

const mathjax_example = "When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$"
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


async function _plot(axis_type: "linear" | "log", attrs: Partial<LinearAxis.Attrs>, side: Side, options?: {minor_size?: number, plot_attrs?: Partial<Plot.Attrs>}) {
  const p = new Plot({
    width: 600,
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
    ...options?.plot_attrs,
  })

  const axis = axis_type == "linear" ? new LinearAxis(attrs) : new LogAxis(attrs)
  p.add_layout(axis, side)
  await display(p)
}
function plot(attrs: Partial<LinearAxis.Attrs>, side: Side, options?: {minor_size?: number, plot_attrs?: Partial<Plot.Attrs>}) {
  return _plot("linear", attrs, side, options)
}
function log_plot(attrs: Partial<LogAxis.Attrs>, side: Side, options?: {minor_size?: number, plot_attrs?: Partial<Plot.Attrs>}) {
  return _plot("log", attrs, side, options)
}

describe("models with MathText", () => {
  it("should divide mathstring into tex/plaintext parts", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plot({axis_label: mathjax_example}, "above", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })
  it("should divide mathstring into tex/plaintext parts be", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plot({axis_label: mathjax_example}, "below", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })

  it("should support LaTeX notation on axis_label strings", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plot({axis_label: tex}, "above", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })

  it("should ignore LaTeX notation on axis_label with string and $ signs using PlainText", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plot({axis_label: new PlainText({text: `$${tex}$`})}, "above", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })

  it("should support LaTeX notation on axis_label with MathText", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plot({axis_label: new TeX({text: tex})}, "above", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })

  it("should support Ascii notation on axis_label with MathText", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plot({axis_label: new Ascii({text: ascii})}, "above", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })

  it("should support MathML notation on axis_label with MathText", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plot({axis_label: new MathML({text: mathml})}, "above", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })

  it("should support LaTeX notation on axis_label with MathText and a delay in loading", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new DelayedInternalProvider())
    try {
      await plot({axis_label: new TeX({text: tex})}, "above", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })

  it("should support LaTeX notation on axis_label with MathText and fallback to text if MathJax has errors", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new NoProvider())
    try {
      await plot({axis_label: new TeX({text: tex})}, "above", {minor_size: 100})
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
        },
      }, "above", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })

  it("should display log tick labels with MathText on overrides", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await log_plot({
        major_label_overrides: {
          0.01: new TeX({text: "\\frac{0.133}{\\mu+2\\sigma^2}"}),
          1: "one",
          10000: new TeX({text: "10 \\ast 1000"}),
          1000000: new TeX({text: "\\sigma^2"}),
        },
      }, "above", {minor_size: 100})
    } finally {
      stub.restore()
    }
  })

  it("should align tick labels with MathText on overrides", async () => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(new InternalProvider())
    try {
      await plot({
        major_label_overrides: {
          0: new TeX({text: "\\frac{0}{0}"}),
          2: new TeX({text: "zero"}),
          4: new TeX({text: "Ten()"}),
          6: new TeX({text: "0"}),
          8: new TeX({text: "Ten"}),
          10: "Ten",
        },
      }, "above", {minor_size: 50, plot_attrs: {x_range: new Range1d({start: 0, end: 10})}})
    } finally {
      stub.restore()
    }
  })

})
