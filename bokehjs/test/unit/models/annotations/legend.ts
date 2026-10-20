import {expect, expect_not_null} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {Legend, LegendView} from "@bokehjs/models/annotations/legend"
import {LegendItem} from "@bokehjs/models/annotations/legend_item"
import {bounding_box} from "@bokehjs/core/dom"

class ModelDrivenLegendView extends LegendView {
  declare model: ModelDrivenLegend

  initial_glyph_size?: {width: number, height: number}
  position_updates = 0
  item_renders = 0

  get entry_els(): HTMLElement[] {
    return this.entries.map(({el}) => el)
  }

  override update_position(): void {
    this.position_updates++
    super.update_position()
  }

  protected override _render_items(): void {
    this.item_renders++
    super._render_items()
  }

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
  for (const field_label of [false, true]) {
    it(`should preserve legend DOM and geometry on data updates with ${field_label ? "field" : "value"} labels`, async () => {
      const p = fig([600, 200], {x_range: [0, 10], y_range: [0, 10]})
      const renderer = p.scatter([1, 2, 3], [1, 2, 3])
      const source = renderer.data_source
      source.data = {x: [1, 2, 3], y: [1, 2, 3], label: ["Short", "Short", "Short"]}
      const item = LegendItem.create({label: field_label ? {field: "label"} : "Short", renderers: [renderer]})
      const legend = ModelDrivenLegend.create({items: [item]})
      p.add_layout(legend, "left")
      const {view} = await display(p)
      await view.ready
      const legend_view = view.owner.get_one(legend)
      legend_view.disconnect_resize_observer()

      const check_update = async (update: () => void) => {
        legend_view.position_updates = 0
        legend_view.item_renders = 0
        update()
        // The transitive handler must not synchronously measure the DOM.
        // RendererView.paint() may still update positioning during painting.
        expect(legend_view.position_updates).to.be.equal(0)
        await view.ready
        expect(legend_view.item_renders).to.be.equal(0)
      }

      await check_update(() => source.data = {x: [1, 2, 3], y: [3, 2, 1], label: ["Short", "Short", "Short"]})
      await check_update(() => source.stream({x: [4], y: [4], label: ["Short"]}))
      await check_update(() => source.patch({y: [[0, 5]]}))
      await check_update(() => renderer.glyph.setv({fill_color: "red"}))
      await check_update(() => source.selected.indices = [0])

      if (field_label) {
        const initial_width = legend_view.bbox.width
        source.data = {x: [1], y: [1], label: ["A much longer legend label than before"]}
        await view.ready
        expect(legend_view.labels.map(({label}) => label)).to.be.equal(["A much longer legend label than before"])
        expect(legend_view.bbox.width).to.be.above(initial_width)
      }
    })
  }

  for (const output_backend of ["canvas", "svg"] as const) {
    for (const field_label of [false, true]) {
      it(`should resize the DOM legend when an item with a ${field_label ? "field" : "value"} label is hidden using ${output_backend}`, async () => {
        const p = fig([600, 200], {output_backend, x_range: [0, 10], y_range: [0, 10]})
        const renderer = p.scatter([1], [1])
        const label = "A much longer legend label than the other item"
        renderer.data_source.data = {x: [1], y: [1], label: [label]}
        const item = LegendItem.create({label: field_label ? {field: "label"} : label, renderers: [renderer]})
        const legend = ModelDrivenLegend.create({items: [item, LegendItem.create({label: "Short", renderers: [renderer]})]})
        p.add_layout(legend, "left")
        const {view} = await display(p)
        await view.ready
        const legend_view = view.owner.get_one(legend)
        legend_view.disconnect_resize_observer()
        const {width, height} = legend_view.bbox

        item.visible = false
        await view.ready
        // LegendItem omits labels for invisible items, so their DOM entries
        // are removed altogether, including when the label itself is unchanged.
        expect(legend_view.entry_els.map((el) => el.textContent)).to.be.equal(["Short"])
        expect(legend_view.shadow_el.querySelectorAll(".bk-item").length).to.be.equal(1)
        expect(legend_view.bbox.width).to.be.below(width)
        expect(legend_view.bbox.height).to.be.below(height)
        expect(renderer.visible).to.be.true

        item.visible = true
        await view.ready
        expect(legend_view.entry_els.map((el) => el.textContent)).to.be.equal([label, "Short"])
        expect(legend_view.entry_els.every((el) => !el.classList.contains("bk-hidden"))).to.be.true
        expect(legend_view.bbox.width).to.be.equal(width)
        expect(legend_view.bbox.height).to.be.equal(height)
      })
    }

    for (const {click_policy, property, active, inactive} of [
      {click_policy: "hide", property: "visible", active: true, inactive: false},
      {click_policy: "mute", property: "muted", active: false, inactive: true},
    ] as const) {
      it(`should sync legend inactive styling with renderer ${property} changes using ${output_backend}`, async () => {
        const p = fig([600, 200], {output_backend, x_range: [0, 10], y_range: [0, 10]})
        const r0 = p.scatter([1], [1])
        const r1 = p.scatter([2], [2])
        const r2 = p.scatter([3], [3])
        const legend = ModelDrivenLegend.create({click_policy, items: [
          LegendItem.create({label: "Shared", renderers: [r0, r1]}),
          LegendItem.create({label: "Other", renderers: [r2]}),
        ]})
        p.add_layout(legend, "left")
        const {view} = await display(p)
        await view.ready
        const legend_view = view.owner.get_one(legend)
        legend_view.disconnect_resize_observer()
        const [shared_el, other_el] = legend_view.entry_els
        expect(shared_el.classList.contains("bk-inactive")).to.be.false
        expect(other_el.classList.contains("bk-inactive")).to.be.false

        const check_update = async (update: () => void, shared_inactive: boolean) => {
          legend_view.position_updates = 0
          legend_view.item_renders = 0
          update()
          expect(legend_view.position_updates).to.be.equal(0)
          await view.ready
          expect(legend_view.item_renders).to.be.equal(0)
          expect(legend_view.entry_els[0]).to.be.identical(shared_el)
          expect(legend_view.entry_els[1]).to.be.identical(other_el)
          expect(shared_el.classList.contains("bk-inactive")).to.be.equal(shared_inactive)
          expect(other_el.classList.contains("bk-inactive")).to.be.false
        }

        // Programmatic changes must sync the overlay, including when only one
        // of several renderers in the same legend item becomes inactive.
        await check_update(() => r0[property] = inactive, true)
        await check_update(() => r1[property] = inactive, true)
        await check_update(() => r0[property] = active, true)
        await check_update(() => r1[property] = active, false)
      })
    }

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
