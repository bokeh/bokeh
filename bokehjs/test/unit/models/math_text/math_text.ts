/// <reference path="../../../../src/lib/external/mathjax.d.ts" />

import { build_view } from "@bokehjs/core/build_views"
import { MathText, MathTextView } from "@bokehjs/models"
import { Renderer, RendererView } from "@bokehjs/models/renderers/renderer"
import { expect } from "assertions"

class SomeRendererView extends RendererView {
  override model: SomeRenderer

  protected _render(): void {}
}

class SomeRenderer extends Renderer {
  override __view_type__: SomeRendererView
  override default_view = SomeRendererView
}

describe("AxisLabelView", () => {
  const model = new MathText({ text: "\\sin(x)"})

  async function plot(): Promise<SomeRendererView> {
    const r = new SomeRenderer()
    return await build_view(r)
  }

  async function load_math_jax_script(): Promise<void> {
    return new Promise(async (resolve, _) => {
      if (!document.getElementById("bokeh_mathjax_script")) {
        const script = document.createElement("script")
        script.id = "bokeh_mathjax_script"
        script.src = "/third-party/tex-svg.js"
        script.onload = async () => {
          resolve()
        }
        document.head.appendChild(script)
      }
    })
  }

  function remove_mathjax_script(): void {
    const mathjax_script = document.getElementById("bokeh_mathjax_script")
    if (mathjax_script) mathjax_script.remove()

    // @ts-ignore
    if (typeof MathJax !== "undefined") MathJax = undefined
  }

  it("should calculate size with image not loaded", () => {
    remove_mathjax_script()
    const view = new MathTextView({model, parent: null})

    expect(view.size()).to.be.equal({width: 27.2216796875, height: 11})
  })

  it("should calculate size of image when its loaded", async () => {
    await load_math_jax_script()
    const view = await build_view(model, {parent: await plot()})

    expect(view.size()).to.be.equal({width: 30.247294921875, height: 11.72970703125})
  })
})