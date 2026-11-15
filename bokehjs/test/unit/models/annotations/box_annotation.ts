import {expect} from "#framework/assertions"
import type {PlotActions} from "#framework/interactive"
import {actions, xy} from "#framework/interactive"
import {display} from "#framework/layouts"

import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot, Range1d, LinearAxis, BoxAnnotation} from "@bokehjs/models"
import {Node} from "@bokehjs/models/coordinates/node"
import {no_repeated} from "@bokehjs/core/util/iterator"
import {assert} from "@bokehjs/core/util/assert"
import {isNumber} from "@bokehjs/core/util/types"

const {min, max} = Math

describe("BoxAnnotation", () => {

  async function mkplot(box: BoxAnnotation, {x_range}: {x_range?: Range1d} = {}): Promise<PlotView> {
    const plot = Plot.create({
      width: 400,
      height: 400,
      min_border: 0,
      x_range: x_range ?? Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
    })
    plot.add_layout(box)
    plot.add_layout(LinearAxis.create(), "above")
    plot.add_layout(LinearAxis.create(), "left")
    const {view} = await display(plot)
    return view
  }

  function get_cursor(plot_view: PlotView): string {
    return getComputedStyle(plot_view.canvas_view.events_el).cursor
  }

  async function get_cursors(ac: PlotActions, events: Iterable<UIEvent>): Promise<string[]> {
    async function* synchronized(): AsyncGenerator<UIEvent> {
      for (const event of events) {
        if (event.type == "pointerup") {
          // Release hit-tests handle geometry from the latest paint.
          await ac.target.ready
        }
        yield event
      }
    }

    const cursors = []
    for await (const _ of ac._emit(synchronized())) {
      cursors.push(get_cursor(ac.target))
    }
    return cursors
  }

  describe("when movable without handles", () => {
    function mkbox() {
      return BoxAnnotation.create({
        left: 0,
        top: 0,
        right: 0.5,
        bottom: 0.5,
        editable: true,
        movable: "both",
      })
    }

    it("should set cursor to 'grab' inside box", async () => {
      const plot_view = await mkplot(mkbox())
      const ac = actions(plot_view, {units: "data"})

      // inside box
      await ac.hover(xy(0.25, 0.25))
      expect(get_cursor(plot_view)).to.be.equal("grab")

      // outside box
      await ac.hover(xy(0.75, 0.75))
      expect(get_cursor(plot_view)).to.be.equal("default")
    })

    it("should set cursor to 'grabbing' when panning", async () => {
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

  it("keeps the dragged edge under the pointer when the opposite edge is out of bounds", async () => {
    const box = BoxAnnotation.create({
      left: -0.5,
      right: 0.5,
      bottom: 0,
      top: 1,
      editable: true,
      resizable: "x",
      left_limit: Node.frame.left,
      right_limit: Node.frame.right,
    })
    const plot_view = await mkplot(box)
    const ac = actions(plot_view, {units: "data"})

    await ac.pan(xy(0.5, 0.5), xy(0.75, 0.5))

    expect(box.left).to.be.equal(-0.5)
    expect(box.right).to.be.equal(0.75)
  })

  describe("should support one-sided limits", () => {
    function box_with_left_limit(): BoxAnnotation {
      return BoxAnnotation.create({
        left: 0.4,
        right: 0.6,
        bottom: 0.4,
        top: 0.6,
        editable: true,
        left_limit: 0.2,
      })
    }

    function x_extent(box: BoxAnnotation): [number, number] {
      const {left, right} = box
      assert(isNumber(left) && isNumber(right))
      return [min(left, right), max(left, right)]
    }

    it("with a normal range", async () => {
      const box = box_with_left_limit()
      const plot_view = await mkplot(box)
      const ac = actions(plot_view, {units: "data"})

      await ac.pan(xy(0.5, 0.5), xy(0.1, 0.5))
      expect(x_extent(box)).to.be.similar([0.2, 0.4])
    })

    it("with a reversed range", async () => {
      // left_limit is the minimum x, which is on the right side of the screen
      const box = box_with_left_limit()
      const plot_view = await mkplot(box, {x_range: Range1d.create({start: 1, end: 0})})
      const ac = actions(plot_view, {units: "data"})

      await ac.pan(xy(0.5, 0.5), xy(0.1, 0.5))
      expect(x_extent(box)).to.be.similar([0.2, 0.4])
    })
  })

  describe("when movable with handles", () => {
    function mkbox() {
      return BoxAnnotation.create({
        left: 0,
        top: 0,
        right: 0.5,
        bottom: 0.5,
        editable: true,
        movable: "both",
        use_handles: true,
      })
    }

    it("should set cursor to 'move' in the middle", async () => {
      const plot_view = await mkplot(mkbox())
      const ac = actions(plot_view, {units: "data"})

      // inside box
      await ac.hover(xy(0.25, 0.25))
      expect(get_cursor(plot_view)).to.be.equal("move")

      // outside box
      await ac.hover(xy(0.75, 0.75))
      expect(get_cursor(plot_view)).to.be.equal("default")
    })

    it("should set cursor to 'move' when panning", async () => {
      const plot_view = await mkplot(mkbox())
      const ac = actions(plot_view, {units: "data"})

      // First, hover to put the cursor in the correct initial state ("move")
      await ac.hover(xy(0.25, 0.25))

      // Next, pan
      const events = ac._pan({type: "line", xy0: xy(0.25, 0.25), xy1: xy(0.75, 0.75), n: 5})
      const cursors = await get_cursors(ac, events)

      expect(cursors).to.be.equal(["move", "move", "default", "move", "move", "move", "move"])
    })
  })
})
