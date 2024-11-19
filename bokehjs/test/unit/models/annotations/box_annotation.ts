import {expect} from "assertions"
import type {PlotActions} from "../../../interactive"
import {actions, xy} from "../../../interactive"
import {display} from "../../_util"

import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot, Range1d, LinearAxis, BoxAnnotation} from "@bokehjs/models"
import {no_repeated} from "@bokehjs/core/util/iterator"

describe("BoxAnnotation", () => {

  async function mkplot(box: BoxAnnotation): Promise<PlotView> {
    const plot = new Plot({
      width: 400,
      height: 400,
      min_border: 0,
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    plot.add_layout(box)
    plot.add_layout(new LinearAxis(), "above")
    plot.add_layout(new LinearAxis(), "left")
    const {view} = await display(plot)
    return view
  }

  function get_cursor(plot_view: PlotView): string {
    return getComputedStyle(plot_view.canvas_view.events_el).cursor
  }

  async function get_cursors(ac: PlotActions, events: Iterable<UIEvent>): Promise<string[]> {
    const cursors = []
    for await (const _ of ac._emit(events)) {
      cursors.push(get_cursor(ac.target))
    }
    return cursors
  }

  describe("when movable without handles", () => {
    function mkbox() {
      return new BoxAnnotation({
        left: 0,
        top: 0,
        right: 0.5,
        bottom: 0.5,
        editable: true,
        movable: "both",
      })
    }

    it("should set cursor to \"grab\" inside box", async () => {
      const plot_view = await mkplot(mkbox())
      const ac = actions(plot_view, {units: "data"})

      // inside box
      await ac.hover(xy(0.25, 0.25))
      expect(get_cursor(plot_view)).to.be.equal("grab")

      // outside box
      await ac.hover(xy(0.75, 0.75))
      expect(get_cursor(plot_view)).to.be.equal("default")
    })

    it("should set cursor to \"grabbing\" when panning", async () => {
      const plot_view = await mkplot(mkbox())
      const ac = actions(plot_view, {units: "data"})

      // First, hover to put the cursor in the correct initial state ("grab")
      await ac.hover(xy(0.25, 0.25))

      // Next, pan
      const events = ac._pan({type: "line", xy0: xy(0.25, 0.25), xy1: xy(0.75, 0.75), n: 5})
      const cursors = await get_cursors(ac, events)

      expect([...no_repeated(cursors)]).to.be
        .equal([...no_repeated(["grab", "grabbing", "grab"])])
    })
  })

  describe("when movable with handles", () => {
    function mkbox() {
      return new BoxAnnotation({
        left: 0,
        top: 0,
        right: 0.5,
        bottom: 0.5,
        editable: true,
        movable: "both",
        use_handles: true,
      })
    }

    it("should set cursor to \"move\" in the middle", async () => {
      const plot_view = await mkplot(mkbox())
      const ac = actions(plot_view, {units: "data"})

      // inside box
      await ac.hover(xy(0.25, 0.25))
      expect(get_cursor(plot_view)).to.be.equal("move")

      // outside box
      await ac.hover(xy(0.75, 0.75))
      expect(get_cursor(plot_view)).to.be.equal("default")
    })

    it("should set cursor to \"move\" when panning", async () => {
      const plot_view = await mkplot(mkbox())
      const ac = actions(plot_view, {units: "data"})

      // First, hover to put the cursor in the correct initial state ("move")
      await ac.hover(xy(0.25, 0.25))

      // Next, pan
      const events = ac._pan({type: "line", xy0: xy(0.25, 0.25), xy1: xy(0.75, 0.75), n: 5})
      const cursors = await get_cursors(ac, events)

      expect(cursors).to.be
        .equal(["move", "move", "default", "move", "move", "move", "move"])
    })
  })
})
