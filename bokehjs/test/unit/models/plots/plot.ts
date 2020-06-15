import {expect} from "assertions"
import * as sinon from 'sinon'

import {Plot} from "@bokehjs/models/plots/plot"
import {PlotView} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Label, LabelView} from "@bokehjs/models/annotations/label"
import {build_view} from "@bokehjs/core/build_views"
import {Place} from "@bokehjs/core/enums"

async function new_plot_view(attrs: Partial<Plot.Attrs> = {}): Promise<PlotView> {
  const plot = new Plot({
    x_range: new Range1d({start: 0, end: 10}),
    y_range: new Range1d({start: 0, end: 10}),
    ...attrs,
  })
  return (await build_view(plot)).build()
}

describe("Plot module", () => {

  describe("Plot", () => {

  })

  describe("PlotView", () => {

    it("should perform standard reset actions by default", async () => {
      const view = await new_plot_view()
      const spy_state = sinon.spy(view, 'clear_state')
      const spy_range = sinon.spy(view, 'reset_range')
      const spy_selection = sinon.spy(view, 'reset_selection')
      const spy_event = sinon.spy(view.model, 'trigger_event')
      view.reset()
      expect(spy_state.called).to.be.true
      expect(spy_range.called).to.be.true
      expect(spy_selection.called).to.be.true
      expect(spy_event.called).to.be.true
    })

    it("should skip standard reset actions for event_only policy", async () => {
      const view = await new_plot_view({reset_policy: "event_only"})
      const spy_state = sinon.spy(view, 'clear_state')
      const spy_range = sinon.spy(view, 'reset_range')
      const spy_selection = sinon.spy(view, 'reset_selection')
      const spy_event = sinon.spy(view.model, 'trigger_event')
      view.reset()
      expect(spy_state.called).to.be.false
      expect(spy_range.called).to.be.false
      expect(spy_selection.called).to.be.false
      expect(spy_event.called).to.be.true
    })

    it("layout should set element style correctly", async () => {
      const view = await new_plot_view({width: 425, height: 658})
      const expected_style = "position: relative; display: block; left: 0px; top: 0px; width: 425px; height: 658px; margin: 0px;"
      expect(view.el.style.cssText).to.be.equal(expected_style)
    })

    it("should set min_border_x to value of min_border if min_border_x is not specified", async () => {
      const view = await new_plot_view({min_border: 33.33})
      expect(view.layout.min_border.top).to.be.equal(33.33)
      expect(view.layout.min_border.bottom).to.be.equal(33.33)
      expect(view.layout.min_border.left).to.be.equal(33.33)
      expect(view.layout.min_border.right).to.be.equal(33.33)
    })

    it("should set min_border_x to value of specified, and others to value of min_border", async () => {
      const view = await new_plot_view({min_border: 33.33, min_border_left: 66.66})
      expect(view.layout.min_border.top).to.be.equal(33.33)
      expect(view.layout.min_border.bottom).to.be.equal(33.33)
      expect(view.layout.min_border.left).to.be.equal(66.66)
      expect(view.layout.min_border.right).to.be.equal(33.33)
    })

    it("should set min_border_x to value of specified, and others to default min_border", async () => {
      const view = await new_plot_view({min_border_left: 4})
      expect(view.layout.min_border.top).to.be.equal(5)
      expect(view.layout.min_border.bottom).to.be.equal(5)
      expect(view.layout.min_border.left).to.be.equal(4)
      expect(view.layout.min_border.right).to.be.equal(5)
    })

    it("should rebuild renderer views after add_layout", async () => {
      const view = await new_plot_view()
      for (const side of Place) {
        const label = new Label({x: 0, y: 0, text: side})
        view.model.add_layout(label, side)
        // We need to do this for each side separately because otherwise
        // even if only e.g. `center.change` is connected, all other changes
        // will be taken into account by `build_renderer_views`.
        await view.ready
        expect(view.renderer_views.get(label)).to.be.instanceof(LabelView)
      }
    })

    describe("PlotView.pause()", () => {

      it("should start unpaused", async () => {
        const view = await new_plot_view()
        expect(view.is_paused).to.be.false
      })

      it("should toggle on/off in pairs", async () => {
        const view = await new_plot_view()
        expect(view.is_paused).to.be.false
        view.pause()
        expect(view.is_paused).to.be.true
        view.unpause()
        expect(view.is_paused).to.be.false
      })

      it("should toggle off only on last unpause with nested pairs", async () => {
        const view = await new_plot_view()
        expect(view.is_paused).to.be.false
        view.pause()
        expect(view.is_paused).to.be.true
        view.pause()
        expect(view.is_paused).to.be.true
        view.unpause()
        expect(view.is_paused).to.be.true
        view.unpause()
        expect(view.is_paused).to.be.false
      })
    })
  })
})
