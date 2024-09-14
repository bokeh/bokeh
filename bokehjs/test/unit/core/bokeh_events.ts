import {expect, expect_instanceof} from "assertions"
import {display} from "../_util"

import {Serializer} from "@bokehjs/core/serialization"
import type {BokehEvent} from "@bokehjs/core/bokeh_events"
import {AxisClick, server_event, UserEvent} from "@bokehjs/core/bokeh_events"
import {paint} from "@bokehjs/core/util/defer"
import type {Model} from "@bokehjs/model"
import {CategoricalAxis, CategoricalScale, FactorRange, Plot, Range1d, LinearAxis, LogAxis} from "@bokehjs/models"
import type {MessageSent, Patch} from "@bokehjs/document"
import {TextInput} from "@bokehjs/models/widgets"
import {PlotActions, xy} from "../../interactive"

@server_event("some_library.do_something")
class DoSomething extends UserEvent {
  constructor(override readonly values: {target: Model, action: "do_this" | "do_that"}) {
    super(values)
  }
}

describe("BokehEvent", () => {
  it("should support user defined events", async () => {
    const collected_events: BokehEvent[] = []

    const widget = new TextInput()
    widget.on_event(DoSomething, (event) => {
      collected_events.push(event)
    })

    const {view, doc} = await display(widget, null)

    const new_event = new DoSomething({target: widget, action: "do_that"})

    const serializer = new Serializer({references: new Map([[widget, widget.ref()]])})
    const new_rep = serializer.encode(new_event)
    expect(new_rep).to.be.equal({
      type: "event",
      name: "some_library.do_something",
      values: {
        type: "map",
        entries: [
          ["model", null],
          ["target", widget.ref()],
          ["action", "do_that"],
        ],
      },
    })

    const msg: MessageSent = {
      kind: "MessageSent",
      msg_type: "bokeh_event",
      msg_data: new_rep,
    }
    const patch: Patch = {events: [msg]}
    doc.apply_json_patch(patch)
    await view.ready

    expect(collected_events.length).to.be.equal(1)

    const [event] = collected_events
    expect_instanceof(event, DoSomething)

    expect(event.origin).to.be.null
    expect(event.values).to.be.equal({target: widget, action: "do_that"})
  })
})

describe("AxisClick event", () => {
  for (const {side, pt} of [{side: "left", pt: xy(5, 200)}, {side: "right", pt: xy(395, 200)}, {side: "above", pt: xy(200, 5)}, {side: "below", pt: xy(200, 395)}]) {
    it(`should support linear axes on side: ${side}`, async () => {
      const plot = new Plot({
        width: 400,
        height: 400,
        title: null,
        toolbar_location: null,
        x_range: new Range1d({start: 0, end: 10}),
        y_range: new Range1d({start: 0, end: 10}),
      })
      const axis = new LinearAxis()
      plot.add_layout(axis, side as any)

      const events: AxisClick[] = []
      axis.on_event(AxisClick, (event: any) => events.push(event))

      const {view} = await display(plot)

      const actions = new PlotActions(view, {units: "screen"})
      await paint()
      await actions.tap(pt)

      expect(events.length).to.be.equal(1)
      expect(events[0].value).to.be.equal(5)
    })
  }

  for (const {side, pt} of [{side: "left", pt: xy(5, 200)}, {side: "right", pt: xy(395, 200)}, {side: "above", pt: xy(200, 5)}, {side: "below", pt: xy(200, 395)}]) {
    it(`should support log axes on side: ${side}`, async () => {
      const plot = new Plot({
        width: 400,
        height: 400,
        title: null,
        toolbar_location: null,
        x_range: new Range1d({start: 1, end: 10000}),
        y_range: new Range1d({start: 1, end: 10000}),
      })
      const axis = new LogAxis()
      plot.add_layout(axis, side as any)

      const events: AxisClick[] = []
      axis.on_event(AxisClick, (event: any) => events.push(event))

      const {view} = await display(plot)

      const actions = new PlotActions(view, {units: "screen"})
      await paint()
      await actions.tap(pt)

      expect(events.length).to.be.equal(1)
      expect(events[0].value).to.be.equal(2) // 10^2 == 100
    })
  }

  for (const {side, pt} of [{side: "left", pt: xy(5, 200)}, {side: "right", pt: xy(395, 200)}, {side: "above", pt: xy(200, 5)}, {side: "below", pt: xy(200, 395)}]) {
    it(`should support categorical axes on side: ${side}`, async () => {
      const plot = new Plot({
        width: 400,
        height: 400,
        title: null,
        toolbar_location: null,
        x_scale: new CategoricalScale(),
        y_scale: new CategoricalScale(),
        x_range: new FactorRange({factors: ["a", "b", "c", "d", "e"]}),
        y_range: new FactorRange({factors: ["a", "b", "c", "d", "e"]}),
      })
      const axis = new CategoricalAxis()
      plot.add_layout(axis, side as any)

      const events: AxisClick[] = []
      axis.on_event(AxisClick, (event: any) => events.push(event))

      const {view} = await display(plot)

      const actions = new PlotActions(view, {units: "screen"})
      await paint()
      await actions.tap(pt)

      expect(events.length).to.be.equal(1)
      expect(events[0].value).to.be.equal("c")
    })
  }
})
