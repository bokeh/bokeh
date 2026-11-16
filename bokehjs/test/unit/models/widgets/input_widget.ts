import {expect, expect_not_null} from "#framework/assertions"
import {display} from "#framework/layouts"
import {mouse_enter, mouse_leave, mouse_down} from "#framework/interactive"

import {
  TextInput, PasswordInput, AutocompleteInput, TextAreaInput, NumericInput, Spinner,
  Select, MultiSelect, ColorPicker, FileInput,
} from "@bokehjs/models/widgets"
import type {InputWidget} from "@bokehjs/models/widgets/input_widget"
import {HTML} from "@bokehjs/models/dom/html"
import {Tooltip} from "@bokehjs/models/ui/tooltip"
import type {TooltipView} from "@bokehjs/models/ui/tooltip"
import type {HasProps} from "@bokehjs/core/has_props"
import type {View} from "@bokehjs/core/view"

describe("InputWidgetView", () => {
  function child_view_of(view: View, model: HasProps): View | null {
    return view.children_views().find((child) => child.model == model) ?? null
  }

  it("should remove the previous title view when 'title' changes", async () => {
    const title = HTML.create({html: "title"})
    const input = TextInput.create({title})
    const {view} = await display(input, [400, 200])

    const title_view = child_view_of(view, title)
    expect_not_null(title_view)

    input.title = HTML.create({html: "other title"})
    await view.ready

    expect(title_view.is_destroyed).to.be.true
  })

  it("should remove the previous description view when 'description' changes", async () => {
    const description = Tooltip.create({content: "description", position: "bottom_center"})
    const input = TextInput.create({description})
    const {view} = await display(input, [400, 200])

    const description_view = child_view_of(view, description)
    expect_not_null(description_view)

    input.description = Tooltip.create({content: "other description", position: "bottom_center"})
    await view.ready

    expect(description_view.is_destroyed).to.be.true
  })

  function label_of(view: View & {shadow_el: ShadowRoot}): HTMLLabelElement | null {
    return view.shadow_el.querySelector("label")
  }

  const widgets: [string, (attrs: Partial<InputWidget.Attrs>) => InputWidget][] = [
    ["TextInput", (attrs) => TextInput.create(attrs)],
    ["PasswordInput", (attrs) => PasswordInput.create(attrs)],
    ["AutocompleteInput", (attrs) => AutocompleteInput.create(attrs)],
    ["TextAreaInput", (attrs) => TextAreaInput.create(attrs)],
    ["NumericInput", (attrs) => NumericInput.create(attrs)],
    ["Spinner", (attrs) => Spinner.create(attrs)],
    ["Select", (attrs) => Select.create({options: ["a", "b"], value: "a", ...attrs})],
    ["MultiSelect", (attrs) => MultiSelect.create({options: ["a", "b"], ...attrs})],
    ["ColorPicker", (attrs) => ColorPicker.create(attrs)],
    ["FileInput", (attrs) => FileInput.create(attrs)],
  ]

  for (const [name, create] of widgets) {
    describe(`for ${name}`, () => {
      it("should not render a label without title and description", async () => {
        const {view} = await display(create({}), [400, 200])
        expect(label_of(view)).to.be.null
      })

      it("should render a label associated with the input element", async () => {
        const {view} = await display(create({title: "Some title"}), [400, 200])
        const label = label_of(view)
        expect_not_null(label)
        expect(label.textContent).to.be.equal("Some title")
        const input = view.shadow_el.getElementById(label.htmlFor)
        expect_not_null(input)
        expect(["INPUT", "SELECT", "TEXTAREA"].includes(input.tagName)).to.be.true
      })
    })
  }

  it("should render a string title and update it", async () => {
    const input = TextInput.create({title: "title"})
    const {view} = await display(input, [400, 200])
    expect(label_of(view)?.textContent).to.be.equal("title")

    input.title = "other title"
    await view.ready
    expect(label_of(view)?.textContent).to.be.equal("other title")

    input.title = ""
    await view.ready
    expect(label_of(view)).to.be.null
  })

  it("should render an HTML title inside the label", async () => {
    const title = HTML.create({html: "<b>bold</b> title"})
    const input = TextInput.create({title})
    const {view} = await display(input, [400, 200])

    const label = label_of(view)
    expect_not_null(label)
    expect(label.querySelector("b")?.textContent).to.be.equal("bold")

    const title_view = child_view_of(view, title)
    expect_not_null(title_view)
    expect(title_view.is_destroyed).to.be.false
  })

  it("should render a string description as icon's tooltip", async () => {
    const input = TextInput.create({title: "title", description: "some description"})
    const {view} = await display(input, [400, 200])

    const {desc_el} = view
    expect_not_null(desc_el)
    expect(desc_el.title).to.be.equal("some description")
    expect(label_of(view)?.contains(desc_el)).to.be.true
  })

  it("should render description's icon without a title", async () => {
    const input = TextInput.create({description: "some description"})
    const {view} = await display(input, [400, 200])
    expect_not_null(label_of(view))
    expect_not_null(view.desc_el)
  })

  it("should show, pin and hide a Tooltip description", async () => {
    const description = Tooltip.create({content: "description", position: "right"})
    const input = TextInput.create({title: "title", description})
    const {view} = await display(input, [400, 200])

    const {desc_el} = view
    expect_not_null(desc_el)
    expect(description.visible).to.be.false

    await mouse_enter(desc_el)
    await view.ready
    expect(description.visible).to.be.true
    expect(description.closable).to.be.false

    await mouse_leave(desc_el)
    await view.ready
    expect(description.visible).to.be.false

    await mouse_enter(desc_el)
    await mouse_down(desc_el)
    await mouse_leave(desc_el)
    await view.ready
    expect(description.visible).to.be.true
    expect(description.closable).to.be.true

    await mouse_down(document.body)
    await view.ready
    expect(description.visible).to.be.false
    expect(description.closable).to.be.false
  })

  it("should target description's icon with a Tooltip description", async () => {
    const description = Tooltip.create({content: "description", position: "right"})
    const input = TextInput.create({title: "title", description})
    const {view} = await display(input, [400, 200])

    const description_view = child_view_of(view, description)
    expect_not_null(description_view)
    const {desc_el} = view
    expect_not_null(desc_el)
    expect((description_view as TooltipView).target.value).to.be.identical(desc_el)

    const other = Tooltip.create({content: "other description", position: "right"})
    input.description = other
    await view.ready

    const other_view = child_view_of(view, other)
    expect_not_null(other_view)
    const {desc_el: other_desc_el} = view
    expect_not_null(other_desc_el)
    expect((other_view as TooltipView).target.value).to.be.identical(other_desc_el)
  })
})
