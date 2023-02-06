import {expect} from "assertions"
import {display} from "../../_util"

import {TextInput} from "@bokehjs/models/widgets"
import {ValueSubmit} from "@bokehjs/core/bokeh_events"

describe("TextInput", () => {
  it("should support ValueSubmit event", async () => {
    const input = new TextInput({value: ""})
    const values: string[] = []
    input.on_event(ValueSubmit, (event) => {
      values.push(event.value)
    })
    const {view} = await display(input, [200, 50])
    const input_view = view.owner.get_one(input)

    function enter() {
      const event = new KeyboardEvent("keyup", {key: "Enter", shiftKey: false, ctrlKey: false, altKey: false})
      input_view.input_el.dispatchEvent(event)
    }

    expect(values).to.be.equal([])
    enter()
    expect(values).to.be.equal([""])
    enter()
    expect(values).to.be.equal(["", ""])
    enter()
    expect(values).to.be.equal(["", "", ""])
    input_view.input_el.value = "abc"
    expect(values).to.be.equal(["", "", ""])
    enter()
    expect(values).to.be.equal(["", "", "", "abc"])
    enter()
    expect(values).to.be.equal(["", "", "", "abc", "abc"])
  })
})
