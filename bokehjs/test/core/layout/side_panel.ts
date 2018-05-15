import {expect} from "chai"
//import * as sinon from "sinon"

import {SidePanel} from "core/layout/side_panel"
//import {update_panel_constraints} from "core/layout/side_panel"

import {Axis} from "models/axes/axis"
import {BasicTicker} from "models/tickers/basic_ticker"
import {BasicTickFormatter} from "models/formatters/basic_tick_formatter"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"

describe("SidePanel", () => {

  describe("apply_location_heuristics", () => {

    it("should calculate appropriate axis_label text properties based on location", () => {
      const p1 = new SidePanel({side: 'left'})
      const ctx1 = {} as any
      p1.apply_label_text_heuristics(ctx1, 'parallel')
      expect(ctx1.textBaseline).to.be.equal("alphabetic")
      expect(ctx1.textAlign).to.be.equal("center")

      const p2 = new SidePanel({side: 'below'})
      const ctx2 = {} as any
      p2.apply_label_text_heuristics(ctx2, Math.PI/2)
      expect(ctx2.textBaseline).to.be.equal("middle")
      expect(ctx2.textAlign).to.be.equal("right")
    })
  })

  describe("get_label_angle_heuristic", () => {

    it("should calculate appropriate axis_label angle rotation based on location", () => {
      const p1 = new SidePanel({side: 'left'})
      const angle1 = p1.get_label_angle_heuristic('parallel')
      expect(angle1).to.be.equal(-Math.PI/2)

      const p2 = new SidePanel({side: 'below'})
      const angle2 = p2.get_label_angle_heuristic('horizontal')
      expect(angle2).to.be.equal(0)
    })
  })

  describe("update_panel_constraints", () => {

    beforeEach(function() {
      const plot = new Plot({
        x_range: new Range1d({start: 0, end: 1}),
        y_range: new Range1d({start: 0, end: 1}),
      })
      const axis = new Axis({
        ticker: new BasicTicker(),
        formatter: new BasicTickFormatter(),
      })
      plot.add_layout(axis, 'below')
      const plot_view = new plot.default_view({model: plot, parent: null}) as any
      this.axis_view = plot_view.plot_canvas_view.renderer_views[axis.id]
    })

    /*
    it("should add two constraints on first call (one for size, one for full)", function() {
      const add_constraint_call_count = this.solver_add_constraint.callCount
      update_panel_constraints(this.axis_view)
      expect(this.solver_add_constraint.callCount).to.be.equal(add_constraint_call_count + 1)
    })

    it("should add and remove a constraint if the size changes", function() {
      this.axis_view._tick_extent = sinon.stub()
      this.axis_view._tick_extent.onCall(0).returns(10)
      this.axis_view._tick_extent.onCall(1).returns(20)

      const add_constraint_call_count = this.solver_add_constraint.callCount
      const remove_constraint_call_count = this.solver_remove_constraint.callCount

      update_panel_constraints(this.axis_view)

      expect(this.solver_add_constraint.callCount).to.be.equal(add_constraint_call_count + 1)
      expect(this.solver_remove_constraint.callCount).to.be.equal(remove_constraint_call_count + 0)

      update_panel_constraints(this.axis_view)

      expect(this.solver_add_constraint.callCount).to.be.equal(add_constraint_call_count + 2)
      expect(this.solver_remove_constraint.callCount).to.be.equal(remove_constraint_call_count + 0)
    })
    */
  })
})
