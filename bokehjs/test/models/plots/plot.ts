import {expect} from "chai"
import * as sinon from 'sinon'

import {Plot} from "models/plots/plot"
import {PlotView} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"
import {CustomJS} from "models/callbacks/customjs"

function new_plot_view(attrs: Partial<Plot.Attrs> = {}): PlotView {
  const plot = new Plot({
    x_range: new Range1d({start: 0, end: 10}),
    y_range: new Range1d({start: 0, end: 10}),
    ...attrs,
  })
  return new plot.default_view({model: plot, parent: null}).build()
}

describe("lib.models.plots.plot", () => {

  describe("Plot", () => {

    it("should not execute range callbacks on initialization", () => {
      const cb = new CustomJS()
      const spy = sinon.spy(cb, 'execute')
      new Plot({
        x_range: new Range1d({callback: cb}),
        y_range: new Range1d({callback: cb}),
      })
      expect(spy.called).to.be.false
    })
  })

  describe("PlotView", () => {

    it("layout should set element style correctly", () => {
      const view = new_plot_view({width: 425, height: 658})
      const expected_style = "position: relative; display: block; left: 0px; top: 0px; width: 425px; height: 658px;"
      expect(view.el.style.cssText).to.be.equal(expected_style)
    })

    it("should set min_border_x to value of min_border if min_border_x is not specified", () => {
      const view = new_plot_view({min_border: 33.33})
      expect(view.layout.min_border.top).to.be.equal(33.33)
      expect(view.layout.min_border.bottom).to.be.equal(33.33)
      expect(view.layout.min_border.left).to.be.equal(33.33)
      expect(view.layout.min_border.right).to.be.equal(33.33)
    })

    it("should set min_border_x to value of specified, and others to value of min_border", () => {
      const view = new_plot_view({min_border: 33.33, min_border_left: 66.66})
      expect(view.layout.min_border.top).to.be.equal(33.33)
      expect(view.layout.min_border.bottom).to.be.equal(33.33)
      expect(view.layout.min_border.left).to.be.equal(66.66)
      expect(view.layout.min_border.right).to.be.equal(33.33)
    })

    it("should set min_border_x to value of specified, and others to default min_border", () => {
      const view = new_plot_view({min_border_left: 4})
      expect(view.layout.min_border.top).to.be.equal(5)
      expect(view.layout.min_border.bottom).to.be.equal(5)
      expect(view.layout.min_border.left).to.be.equal(4)
      expect(view.layout.min_border.right).to.be.equal(5)
    })

    describe("PlotView.pause()", () => {

      it("should start unpaused", () => {
        const view = new_plot_view()
        expect(view.is_paused).to.be.false
      })

      it("should toggle on/off in pairs", () => {
        const view = new_plot_view()
        expect(view.is_paused).to.be.false
        view.pause()
        expect(view.is_paused).to.be.true
        view.unpause()
        expect(view.is_paused).to.be.false
      })

      it("should toggle off only on last unpause with nested pairs", () => {
        const view = new_plot_view()
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

    describe("PlotView.get_canvas_element()", () => {

      it("should exist because get_canvas_element depends on it", () => {
        const view = new_plot_view()
        expect(view.canvas_view.ctx).to.exist
      })

      it("should exist to grab the canvas DOM element using canvas_view.ctx", () => {
        const view = new_plot_view()
        expect(view.canvas_view.get_canvas_element).to.exist
      })
    })
  })
})
