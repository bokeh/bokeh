import {display} from "#framework/layouts"
import {expect} from "#framework/assertions"

import {
  Button,
  ColorPicker,
  DatePicker,
  DateRangePicker,
  DatetimePicker,
  DatetimeRangePicker,
  FileInput,
  MultiChoice,
  MultiSelect,
  PaletteSelect,
  Select,
  Spinner,
  TextAreaInput,
  TextInput,
  TimePicker,
} from "@bokehjs/models/widgets"

describe("Input widgets", () => {
  describe("should support <label for>", () => {
    it("in ColorPicker", async () => {
      const input = ColorPicker.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in DatePicker", async () => {
      const input = DatePicker.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in DateRangePicker", async () => {
      const input = DateRangePicker.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in DatetimePicker", async () => {
      const input = DatetimePicker.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in DatetimeRangePicker", async () => {
      const input = DatetimeRangePicker.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in FileInput", async () => {
      const input = FileInput.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in MultiChoice", async () => {
      const input = MultiChoice.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in MultiSelect", async () => {
      const input = MultiSelect.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in PaletteSelect", async () => {
      const input = PaletteSelect.create({value: "RGB", items: [["RGB", ["red", "green", "blue"]]]})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in Select", async () => {
      const input = Select.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in Spinner", async () => {
      const input = Spinner.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in TextAreaInput", async () => {
      const input = TextAreaInput.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in TextInput", async () => {
      const input = TextInput.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in TimePicker", async () => {
      const input = TimePicker.create({title: "Title"})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
  })
})

describe("Button", () => {
  it("should update runtime resizable styling", async () => {
    const button = Button.create({label: "Button", resizable: "both"})
    const {view} = await display(button, [200, 100])

    expect(view.style.css.includes("resize: both;")).to.be.true
    expect(view.style.css.includes("overflow: auto;")).to.be.true

    button.resizable = false
    await view.ready

    expect(view.style.css.includes("resize:")).to.be.false
    expect(view.style.css.includes("overflow: auto;")).to.be.false
  })
})
