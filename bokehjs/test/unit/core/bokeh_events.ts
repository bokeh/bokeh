import {expect, expect_instanceof} from "assertions"
import {display} from "../_util"

import {Serializer} from "@bokehjs/core/serialization"
import type {BokehEvent} from "@bokehjs/core/bokeh_events"
import {server_event, UserEvent} from "@bokehjs/core/bokeh_events"
import type {Model} from "@bokehjs/model"
import type {MessageSent, Patch} from "@bokehjs/document"
import {TextInput} from "@bokehjs/models/widgets"

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
