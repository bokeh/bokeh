import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {TextInput} from "@bokehjs/models/widgets"
import {ValueSubmit} from "@bokehjs/core/bokeh_events"

describe("TextInput", () => {
  it("should support ValueSubmit event", async () => {
    const input = TextInput.create({value: ""})
    const values: string[] = []
    input.on_event(ValueSubmit, (event) => {
      values.push(event.value)
    })
    const {view} = await display(input, [250, 50])
    const input_el = view.shadow_el.querySelector("input")!

    function enter() {
      const event = new KeyboardEvent("keyup", {key: "Enter", shiftKey: false, ctrlKey: false, altKey: false})
      input_el.dispatchEvent(event)
    }

    expect(values).to.be.equal([])
    enter()
    expect(values).to.be.equal([""])
    enter()
    expect(values).to.be.equal(["", ""])
    enter()
    expect(values).to.be.equal(["", "", ""])
    input_el.value = "abc"
    expect(values).to.be.equal(["", "", ""])
    enter()
    expect(values).to.be.equal(["", "", "", "abc"])
    enter()
    expect(values).to.be.equal(["", "", "", "abc", "abc"])
  })
})
