import {expect, expect_not_null} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {Legend, LegendView} from "@bokehjs/models/annotations/legend"
import {LegendItem} from "@bokehjs/models/annotations/legend_item"
import {bounding_box} from "@bokehjs/core/dom"

class ModelDrivenLegendView extends LegendView {
  declare model: ModelDrivenLegend

  initial_glyph_size?: {width: number, height: number}

  override after_render(): void {
    super.after_render()
    const {width, height} = bounding_box(this.entries[0].glyph.canvas)
    this.initial_glyph_size ??= {width, height}
  }

  disconnect_resize_observer(): void {
    this._resize_observer.disconnect()
  }
}

class ModelDrivenLegend extends Legend {
  declare __view_type__: ModelDrivenLegendView

  static {
    this.prototype.default_view = ModelDrivenLegendView
  }
}

describe("LegendView", () => {
  for (const output_backend of ["canvas", "svg"] as const) {
    for (const margin of [0, 10]) {
      it(`should settle label growth and shrinkage before ready resolves with ${output_backend} and margin=${margin}`, async () => {
        const p = fig([600, 200], {output_backend})
        const scatter = p.scatter([1, 2, 3], [1, 2, 3])
        const item = LegendItem.create({label: "Short", renderers: [scatter]})
        const legend = ModelDrivenLegend.create({items: [item], margin})
        p.add_layout(legend, "left")

        const {view} = await display(p)
        await view.ready
        const legend_view = view.owner.get_one(legend)

        // Initial geometry must use the configured glyph size before its first
        // paint, including SVG layers whose intrinsic default is much larger.
        expect(legend_view.initial_glyph_size).to.be.equal({width: legend.glyph_width, height: legend.glyph_height})

        // Model changes must settle without waiting for a future browser resize
        // notification, which is not included in the current ready promise.
        legend_view.disconnect_resize_observer()

        const check_layout = () => {
          const bbox = bounding_box(legend_view.el).relative_to(bounding_box(view.canvas.el))
          expect(legend_view.bbox).to.be.equal(bbox)
          const {layout} = legend_view
          expect_not_null(layout)
          expect(layout.bbox.width).to.be.equal(Math.round(bbox.width + 2*margin))
          return layout.bbox.width
        }

        const initial_width = check_layout()
        const initial_frame_left = view.frame.bbox.left

        item.label = "A much longer legend label than before"
        await view.ready

        const grown_width = check_layout()
        expect(grown_width).to.be.above(initial_width)
        expect(view.frame.bbox.left - initial_frame_left).to.be.equal(grown_width - initial_width)

        item.label = "Short"
        await view.ready

        expect(check_layout()).to.be.equal(initial_width)
        expect(view.frame.bbox.left).to.be.equal(initial_frame_left)
      })
    }
  }
})
