import sinon from "sinon"

import {wait} from "@bokehjs/core/util/defer"

import {tex2svg, mathml2svg} from "@bokehjs/models/text/mathjax"
import {MathTextView} from "@bokehjs/models/text/math_text"
import {MathJaxProvider, NoProvider} from "@bokehjs/models/text/providers"
import {LinearAxis, Plot, TeX, Ascii, MathML} from "@bokehjs/models"

import {display} from "./_util"

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

describe("MathText model", () => {
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

  function plotAxis(attrs: Partial<LinearAxis.Attrs>) {
    const p = new Plot()
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
})
