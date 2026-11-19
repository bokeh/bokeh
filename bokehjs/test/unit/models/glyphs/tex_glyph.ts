import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"
import {with_provider} from "#framework/util"

import {MathJaxProvider} from "@bokehjs/models/text/providers"
import {ascii2svg, find_tex, mathml2svg, tex2svg} from "@bokehjs/models/text/mathjax"
import {TeXGlyphView} from "@bokehjs/models/glyphs/tex_glyph"
import {MathTextView} from "@bokehjs/models/text/math_text"

/** Loads MathJax once `finish()` is called. */
class ControlledProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {ascii2svg, find_tex, mathml2svg, tex2svg} : null
  }

  private _finish: (() => void) | null = null
  private _start: (() => void) | null = null
  readonly started = new Promise<void>((resolve) => this._start = resolve)

  async fetch(): Promise<void> {
    this.status = "loading"
    this._start?.()
    await new Promise<void>((resolve) => this._finish = resolve)
    this.status = "loaded"
    this.ready.emit()
  }

  finish(): void {
    this._finish?.()
  }
}

describe("TeXGlyph", () => {
  it("should update label sizes when MathJax is loaded after the glyph was built", async () => {
    const provider = new ControlledProvider()
    await with_provider(provider)(async () => {
      const p = fig([300, 300], {x_range: [0, 10], y_range: [0, 10]})
      const renderer = p.tex({
        x: [2, 5],
        y: [2, 5],
        text: [String.raw`\frac{1}{x^2}`, String.raw`\int_0^1 x dx`],
        text_font_size: "20px",
        padding: 5,
        display: "block",
      })

      // display() waits for `ready`, which includes loading MathJax, so let
      // label views start loading it, and only then make it available
      const display_task = display(p)
      await provider.started
      provider.finish()
      const {view} = await display_task
      await view.ready

      const glyph_view = view.owner.get_one(renderer).glyph
      expect(glyph_view).to.be.instanceof(TeXGlyphView)
      const {labels, swidth, sheight, padding} = glyph_view as TeXGlyphView

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i]
        expect(label).to.be.instanceof(MathTextView)
        // images were loaded, so sizes aren't those of the fallback anymore
        expect((label as unknown as {svg_image: unknown}).svg_image).to.not.be.null
        const size = (label as MathTextView).size()
        // `swidth` and `sheight` are float32 arrays
        expect(swidth[i]).to.be.equal(Math.fround(padding.left + size.width + padding.right))
        expect(sheight[i]).to.be.equal(Math.fround(padding.top + size.height + padding.bottom))
      }
    })
  })
})
