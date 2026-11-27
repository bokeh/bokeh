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
  MultipleDatetimePicker,
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
      const input = ColorPicker.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in DatePicker", async () => {
      const input = DatePicker.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in DateRangePicker", async () => {
      const input = DateRangePicker.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in DatetimePicker", async () => {
      const input = DatetimePicker.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in DatetimeRangePicker", async () => {
      const input = DatetimeRangePicker.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in FileInput", async () => {
      const input = FileInput.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in MultiChoice", async () => {
      const input = MultiChoice.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in MultiSelect", async () => {
      const input = MultiSelect.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in PaletteSelect", async () => {
      const input = PaletteSelect.create({value: "RGB", items: [["RGB", ["red", "green", "blue"]]]})
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in Select", async () => {
      const input = Select.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in Spinner", async () => {
      const input = Spinner.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in TextAreaInput", async () => {
      const input = TextAreaInput.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in TextInput", async () => {
      const input = TextInput.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
    it("in TimePicker", async () => {
      const input = TimePicker.create()
      const {view} = await display(input, null)
      expect(view.shadow_el.querySelector("label")?.getAttribute("for")).to.be.equal("input")
    })
  })
})

describe("Button", () => {
  it("should update runtime resizable styling", async () => {
    const button = Button.create({label: "Button", resizable: "both"})
    const {view} = await display(button, [200, 100])

    expect(view.self_style.css.includes("resize: both;")).to.be.true
    expect(view.self_style.css.includes("overflow: auto;")).to.be.true

    button.resizable = false
    await view.ready

    expect(view.self_style.css.includes("resize:")).to.be.false
    expect(view.self_style.css.includes("overflow: auto;")).to.be.false
  })
})

describe("Datetime pickers", () => {
  const d0 = new Date("2026-08-04T15:00:52.000Z")
  const d1 = new Date("2026-08-05T16:01:53.000Z")

  it("should preserve the selected instant in DatetimePicker", async () => {
    const input = DatetimePicker.create({value: d0})
    const {view} = await display(input, null)
    view.picker.setDate(d0, true)
    expect(input.value).to.be.equal(d0.toISOString())
  })

  it("should preserve the selected instants in DatetimeRangePicker", async () => {
    const input = DatetimeRangePicker.create({value: [d0, d1]})
    const {view} = await display(input, [600, 500])
    view.picker.setDate([d0, d1], true)
    expect(input.value).to.be.equal([d0.toISOString(), d1.toISOString()])
  })

  it("should preserve the selected instants in MultipleDatetimePicker", async () => {
    const input = MultipleDatetimePicker.create({value: [d0, d1]})
    const {view} = await display(input, [600, 500])
    view.picker.setDate([d0, d1], true)
    expect(input.value).to.be.equal([d0.toISOString(), d1.toISOString()])
  })
})
