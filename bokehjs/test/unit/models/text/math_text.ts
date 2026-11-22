import * as sinon from "sinon"
import {expect} from "#framework/assertions"
import {InternalProvider, with_provider} from "#framework/util"

import {build_view} from "@bokehjs/core/build_views"
import {MathML, TeX} from "@bokehjs/models/text/math_text"

describe("MathTextView", () => {
  for (const [model, replacement] of [
    [TeX.create({text: "x"}), "y"],
    [
      MathML.create({text: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math>'}),
      '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>y</mi></math>',
    ],
  ] as const) {
    it(`should defer ${model.type} image loading until visuals are assigned`, async () => {
      const provider = new InternalProvider()
      provider.status = "loading"

      await with_provider(provider)(async () => {
        const view = await build_view(model)
        const request_image = sinon.spy(view, "request_image")
        try {
          provider.status = "loaded"
          provider.ready.emit()
          await view.ready

          model.text = replacement
          await view.ready
          expect(request_image.called).to.be.false

          view.visuals = {
            color: "black",
            alpha: 1,
            font: "sans-serif",
            font_size: "13px",
            font_style: "normal",
            align: "left",
            baseline: "alphabetic",
            line_height: 1.2,
            outline_color: null,
            outline_width: 1,
          }
          await view.request_image()

          expect(request_image.calledOnce).to.be.true
          const {width, height} = view.size()
          expect(width).to.be.above(0)
          expect(height).to.be.above(0)
        } finally {
          request_image.restore()
          view.remove()
        }
      })
    })
  }
})
