import {display, column} from "#framework/layouts"
import {tap, mouse_click} from "#framework/interactive"
import {expect_not_null} from "#framework/assertions"

import {range} from "@bokehjs/core/util/array"
import {ButtonType} from "@bokehjs/core/enums"
import type {Color} from "@bokehjs/core/types"

import {HTML} from "@bokehjs/models/dom"
import {ColumnDataSource, Row} from "@bokehjs/models"

import {
  Button, Toggle, Dropdown,
  Checkbox, Switch, LightDark,
  CheckboxGroup, RadioGroup,
  CheckboxButtonGroup, RadioButtonGroup,
  PaletteSelect,
  TextInput, PasswordInput, AutocompleteInput, TextAreaInput, FileInput,
  MultiChoice, Select, MultiSelect,
  Slider, RangeSlider, DateSlider, DateRangeSlider, CategoricalSlider,
  TimePicker,
  DatePicker, DateRangePicker, MultipleDatePicker,
  DatetimePicker, DatetimeRangePicker, MultipleDatetimePicker,
  Paragraph, Div, PreText,
  Progress,
  Markdown,
} from "@bokehjs/models/widgets"

import {
  DataTable, DataCube,
  TableColumn,
  StringFormatter,
  SumAggregator, GroupingInfo,
} from "@bokehjs/models/widgets/tables"

import type {PickerBaseView} from "@bokehjs/models/widgets/picker_base"

import * as palettes from "@bokehjs/api/palettes"

async function finished_animating(el: Element): Promise<void> {
  return new Promise((resolve, reject) => {
    el.addEventListener("animationend", () => resolve(), {once: true})
    el.addEventListener("animationcancel", () => reject(), {once: true})
  })
}

export async function open_picker(view: PickerBaseView): Promise<void> {
  await mouse_click(view.picker._input)
  await view.ready

  const calendar_el = view.shadow_el.querySelector(".flatpickr-calendar")
  expect_not_null(calendar_el)
  await finished_animating(calendar_el)
}

describe("Widgets", () => {
  it("should allow Button", async () => {
    const buttons = [...(function* () {
      for (const button_type of ButtonType) {
        yield Button.create({
          label: `Button ${button_type}`,
          button_type,
          width: 300, height: 30, sizing_mode: "fixed",
        })
      }
    })()]
    const obj = column(buttons)
    await display(obj, [350, buttons.length*(30 + 10) + 50])
  })

  it.allowing(6)("should allow Toggle", async () => {
    const obj = Toggle.create({label: "Toggle 1", button_type: "primary"})
    await display(obj, [500, 100])
  })

  it("should allow Dropdown", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = Dropdown.create({label: "Dropdown 1", button_type: "primary", menu})
    await display(obj, [500, 100])
  })

  it("should allow Dropdown with menu open", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = Dropdown.create({label: "Dropdown 1", button_type: "primary", menu})
    const {view} = await display(obj, [500, 200])

    const button_el = view.shadow_el.querySelector("button")
    expect_not_null(button_el)

    await mouse_click(button_el)
    await view.ready
  })

  it("should allow split Dropdown", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = Dropdown.create({label: "Dropdown 2", button_type: "primary", menu, split: true})
    await display(obj, [500, 100])
  })

  it("should allow split Dropdown with menu open", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = Dropdown.create({label: "Dropdown 1", button_type: "primary", menu, split: true})
    const {view} = await display(obj, [500, 200])

    const toggle_el = view.shadow_el.querySelector(".bk-dropdown-toggle")
    expect_not_null(toggle_el)

    await mouse_click(toggle_el)
    await view.ready
  })

  describe("should support PaletteSelect", () => {
    const items: [string, Color[]][] = [
      ["RdBu", palettes.RdBu11],
      ["RdGy", palettes.RdGy11],
      ["RdYlBu", palettes.RdYlBu11],
      ["Spectral", palettes.Spectral11],
      ["RdYlGn", palettes.RdYlGn11],
      ["Accent", palettes.Accent8],
      ["Paired", palettes.Paired12],
      ["Magma", palettes.Magma256],
      ["Inferno", palettes.Inferno256],
      ["Plasma", palettes.Plasma256],
      ["Viridis", palettes.Viridis256],
      ["Cividis", palettes.Cividis256],
      ["Turbo", palettes.Turbo256],
    ]

    it("with default settings", async () => {
      const obj = PaletteSelect.create({value: "RdBu", items})
      const {view} = await display(obj, [250, 400])

      await tap(view.input_el)
      await view.ready
    })

    it("with ncols=3", async () => {
      const obj = PaletteSelect.create({value: "Magma", items, ncols: 3})
      const {view} = await display(obj, [500, 200])

      await tap(view.input_el)
      await view.ready
    })

    it("with swatch_width=20px", async () => {
      const obj = PaletteSelect.create({value: "Magma", items, ncols: 3, swatch_width: 20})
      const {view} = await display(obj, [500, 200])

      await tap(view.input_el)
      await view.ready
    })

    it("with swatch_height=50px", async () => {
      const obj = PaletteSelect.create({value: "Magma", items, ncols: 3, swatch_height: 50})
      const {view} = await display(obj, [500, 400])

      await tap(view.input_el)
      await view.ready
    })

    it("with disabled=true", async () => {
      const obj = PaletteSelect.create({value: "Accent", items, disabled: true})
      const {view} = await display(obj, [250, 50])

      await tap(view.input_el)
      await view.ready
    })
  })

  it("should allow Checkbox with active=false", async () => {
    const obj = Checkbox.create({active: false, label: "Inactive checkbox"})
    await display(obj, [500, 50])
  })

  it("should allow Checkbox with active=true", async () => {
    const obj = Checkbox.create({active: true, label: "Active checkbox"})
    await display(obj, [500, 50])
  })

  it("should allow Switch with active=false", async () => {
    const obj = Switch.create({active: false})
    await display(obj, [100, 30])
  })

  it("should allow Switch with active=true", async () => {
    const obj = Switch.create({active: true})
    await display(obj, [100, 30])
  })

  it("should allow Switch with active=null", async () => {
    const obj = Switch.create({active: null})
    await display(obj, [100, 30])
  })

  it("should allow Switch with active=false and off_icon", async () => {
    const obj = Switch.create({active: false, off_icon: "dark_theme"})
    await display(obj, [100, 30])
  })

  it("should allow Switch with active=true and on_icon", async () => {
    const obj = Switch.create({active: true, on_icon: "light_theme"})
    await display(obj, [100, 30])
  })

  it("should allow Switch with active=null and indeterminate_icon", async () => {
    const obj = Switch.create({active: null, indeterminate_icon: "system_theme"})
    await display(obj, [100, 30])
  })

  it("should allow Switch with active=true and label", async () => {
    const obj = Switch.create({active: true, label: "Display:"})
    await display(obj, [100, 30])
  })

  describe("should support Progress indicator widget", () => {
    describe("in determinate mode", () => {
      it("and horizontal orientation", async () => {
        const obj = Progress.create({
          mode: "determinate",
          orientation: "horizontal",
          value: 105,
          min: 0,
          max: 179,
          label: "@{index} of @{total} (@{percent}%)",
          width: 200,
        })
        await display(obj, [300, 100])
      })

      it("and vertical orientation", async () => {
        const obj = Progress.create({
          mode: "determinate",
          orientation: "vertical",
          value: 105,
          min: 0,
          max: 179,
          label: "@{index} of @{total} (@{percent}%)",
          height: 200,
        })
        await display(obj, [100, 300])
      })
    })
  })

  it("should allow CheckboxGroup", async () => {
    const obj = CheckboxGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
    await display(obj, [500, 100])
  })

  it("should allow RadioGroup", async () => {
    const obj = RadioGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
    await display(obj, [500, 100])
  })

  it.allowing(9)("should allow CheckboxButtonGroup", async () => {
    const obj = CheckboxButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
    await display(obj, [500, 100])
  })

  it.allowing(9)("should allow CheckboxButtonGroup in vertical orientation", async () => {
    const obj = CheckboxButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], orientation: "vertical"})
    await display(obj, [100, 150])
  })

  it.allowing(9)("should allow RadioButtonGroup", async () => {
    const obj = RadioButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
    await display(obj, [500, 100])
  })

  it.allowing(9)("should allow RadioButtonGroup in vertical orientation", async () => {
    const obj = RadioButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0, orientation: "vertical"})
    await display(obj, [100, 150])
  })

  it.allowing(8)("should allow TextInput", async () => {
    const obj = TextInput.create({placeholder: "Enter value ..."})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextInput with prefix", async () => {
    const obj = TextInput.create({placeholder: "Enter temperature ...", prefix: "T"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextInput with suffix", async () => {
    const obj = TextInput.create({placeholder: "Enter temperature ...", suffix: "\u2103"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextInput with prefix and suffix", async () => {
    const obj = TextInput.create({placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextInput with title, prefix and suffix", async () => {
    const obj = TextInput.create({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow PasswordInput", async () => {
    const obj = PasswordInput.create({value: "foo"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow PasswordInput with password visible", async () => {
    const obj = PasswordInput.create({value: "foo"})
    const {view} = await display(obj, [500, 100])
    await mouse_click(view.toggle_el)
  })

  it.allowing(8)("should allow AutocompleteInput", async () => {
    const completions = ["aaa", "aab", "aac", "baa", "caa"]
    const obj = AutocompleteInput.create({placeholder: "Enter value ...", completions})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow AutocompleteInput with min_characters==0 and completions showed on focusin", async () => {
    const completions = ["aaa", "aab", "aac", "baa", "caa"]
    const obj = AutocompleteInput.create({placeholder: "Enter value ...", completions, min_characters: 0})
    const {view} = await display(obj, [500, 300])
    const ev = new FocusEvent("focusin")
    view.input_el.dispatchEvent(ev)
    await view.ready
  })

  it.allowing(8)("should allow TextAreaInput", async () => {
    const obj = TextAreaInput.create({placeholder: "Enter text ...", cols: 20, rows: 4})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextAreaInput with resizable=true", async () => {
    const obj = TextAreaInput.create({placeholder: "Enter text ...", cols: 20, rows: 4, resizable: true})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow FileInput", async () => {
    const obj = FileInput.create({accept: ".csv,.json.,.txt", multiple: false})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow MultiChoice", async () => {
    const obj = MultiChoice.create({options: ["Option 1", "Option 2", "Option 3"], value: ["Option 1", "Option 3"]})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow MultiChoice with empty value", async () => {
    const obj = MultiChoice.create({options: ["Option 1", "Option 2", "Option 3"]})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow Select", async () => {
    const obj = Select.create({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow Select with empty value", async () => {
    const obj = Select.create({options: ["Option 1", "Option 2", "Option 3"]})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow Select with non-string options", async () => {
    const obj = Select.create({options: [[10, "Option 1"], [20, "Option 2"], [30, "Option 3"]], value: 10})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow MultiSelect", async () => {
    const options = range(16).map((i) => `Option ${i+1}`)
    const obj = MultiSelect.create({options, size: 6})
    await display(obj, [500, 150])
  })

  it("should allow Slider with math text string on title", async () => {
    const obj = Slider.create({title: "$$\\mu$$", value: 10, start: 0, end: 100, step: 0.5})
    await display(obj, [500, 100])
  })

  it("should allow Slider", async () => {
    const obj = Slider.create({value: 10, start: 0, end: 100, step: 0.5})
    await display(obj, [500, 100])
  })

  it("should allow DateSlider", async () => {
    const obj = DateSlider.create({
      value: Date.UTC(2016, 1, 1),
      start: Date.UTC(2015, 1, 1),
      end: Date.UTC(2017, 12, 31),
    })
    await display(obj, [500, 100])
  })

  it("should allow RangeSlider", async () => {
    const obj = RangeSlider.create({value: [10, 90], start: 0, end: 100, step: 0.5})
    await display(obj, [500, 100])
  })

  it("should allow DateRangeSlider", async () => {
    const obj = DateRangeSlider.create({
      value: [Date.UTC(2016, 1, 1), Date.UTC(2016, 12, 31)],
      start: Date.UTC(2015, 1, 1),
      end: Date.UTC(2017, 12, 31),
    })
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow CategoricalSlider", async () => {
    const obj = CategoricalSlider.create({categories: ["a", "b", "c", "d"], value: "b"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow DatePicker", async () => {
    const d0 = "2023-01-18"
    const obj = DatePicker.create({value: d0, width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow DateRangePicker", async () => {
    const d0 = "2023-01-18"
    const d1 = "2023-01-23"
    const obj = DateRangePicker.create({value: [d0, d1], width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow MultipleDatePicker", async () => {
    const d0 = "2023-01-18"
    const d1 = "2023-01-23"
    const d2 = "2023-01-24"
    const d3 = "2023-01-27"
    const obj = MultipleDatePicker.create({value: [d0, d1, d2, d3], width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow DatetimePicker", async () => {
    const d0 = "2023-01-18T09:37:52"
    const obj = DatetimePicker.create({value: d0, width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow DatetimeRangePicker", async () => {
    const d0 = "2023-01-18T09:37:52"
    const d1 = "2023-01-23T20:17:25"
    const obj = DatetimeRangePicker.create({value: [d0, d1], width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow MultipleDatetimePicker", async () => {
    const d0 = "2023-01-18T09:37:52"
    const d1 = "2023-01-23T20:17:25"
    const d2 = "2023-01-24T15:00:00"
    const d3 = "2023-01-27T03:59:59"
    const obj = MultipleDatetimePicker.create({value: [d0, d1, d2, d3], width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow TimePicker", async () => {
    const t0 = "09:37:52"
    const obj = TimePicker.create({value: t0})
    const {view} = await display(obj, [500, 150])
    await open_picker(view)
  })

  it.allowing(8)("should allow TimePicker with seconds", async () => {
    const t0 = "09:37:52"
    const obj = TimePicker.create({value: t0, time_format: "H:i:S", seconds: true})
    const {view} = await display(obj, [500, 150])
    await open_picker(view)
  })

  it.allowing(8)("should allow TimePicker with seconds and 12h clock", async () => {
    const t0 = "09:37:52"
    const obj = TimePicker.create({value: t0, time_format: "H:i:S", seconds: true, clock: "12h"})
    const {view} = await display(obj, [500, 150])
    await open_picker(view)
  })

  it("should allow Div", async () => {
    const obj = Div.create({text: "some <b>text</b>"})
    await display(obj, [500, 100])
  })

  it("should allow Div with float children", async () => {
    const html = 'Some <b>bold text<b/>.<div style="float: left; width: 40px; height: 40px; background-color: red"></div>'
    const obj = Div.create({text: html, styles: {border: "1px dotted blue", padding: "5px"}})
    await display(obj, [500, 100])
  })

  it("should allow Paragraph", async () => {
    const obj = Paragraph.create({text: "some text"})
    await display(obj, [500, 100])
  })

  it("should allow PreText", async () => {
    const obj = PreText.create({text: "some text"})
    await display(obj, [500, 100])
  })

  it("should allow Markdown", async () => {
    const obj = Markdown.create({text: "**Bold text** with some *italic text* and `inline code`."})
    await display(obj, [500, 100])
  })

  it("should allow DataTable in force_fit mode", async () => {
    const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = TableColumn.create({field: "index", title: "Index"})
    const bar_col = TableColumn.create({field: "bar", title: "Bar"})
    const columns = [index_col, bar_col]
    const table = DataTable.create({source, columns, autosize_mode: "force_fit"})
    await display(table, [600, 400])
  })

  it("should allow DataTable in fit_columns mode", async () => {
    const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = TableColumn.create({field: "index", title: "Index"})
    const bar_col = TableColumn.create({field: "bar", title: "Bar"})
    const columns = [index_col, bar_col]
    const table = DataTable.create({source, columns, autosize_mode: "fit_columns"})
    await display(table, [600, 400])
  })

  // TODO: fit_viewport needs a redesign
  // TODO: add support for xfail()
  it.skip("should allow DataTable in fit_viewport mode", async () => {
    const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = TableColumn.create({field: "index", title: "Index"})
    const bar_col = TableColumn.create({field: "bar", title: "Bar"})
    const columns = [index_col, bar_col]
    const table = DataTable.create({source, columns, autosize_mode: "fit_viewport"})
    await display(table, [600, 400])
  })

  it("should allow DataTable in none mode", async () => {
    const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = TableColumn.create({field: "index", title: "Index", width: 200})
    const bar_col = TableColumn.create({field: "bar", title: "Bar", width: 350})
    const columns = [index_col, bar_col]
    const table = DataTable.create({source, columns, autosize_mode: "none"})
    await display(table, [600, 400])
  })

  it("should allow DataTable to toggle column visibility", async () => {
    const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], foo: [10, 20, 30, 40], bar: [3.4, 1.2, 0, -10]}})
    const index_col = TableColumn.create({field: "index", title: "Index", width: 200})
    const foo_col = TableColumn.create({field: "foo", title: "Foo", width: 350})
    const bar_col = TableColumn.create({field: "bar", title: "Bar", width: 350})
    const columns = [index_col, foo_col, bar_col]
    const table = DataTable.create({source, columns, autosize_mode: "none"})
    const {view} = await display(table, [600, 400])
    foo_col.visible = false
    await view.ready
  })

  it("should allow DataTable with and without HTML column titles", async () => {
    const source = ColumnDataSource.create({data: {c1: [0, 1, 2, 10], c2: [10, 20, 30, 40], c3: [3.4, 1.2, 0, -10]}})
    const columns = [
      TableColumn.create({field: "c1", title: "a<b", width: 200}),
      TableColumn.create({field: "c2", title: HTML.create({html: "a<b"}), width: 200}),
      TableColumn.create({field: "c3", title: HTML.create({html: "<b>a&lt;b</b>"}), width: 200}),
    ]
    const table = DataTable.create({source, columns, autosize_mode: "none"})
    const {view} = await display(table, [600, 400])
    await view.ready
  })

  it("should allow DataCube", async () => {
    const source = ColumnDataSource.create({
      data: {
        d0: ["A", "E", "E", "E", "J", "L", "M"],
        d1: ["B", "D", "D", "H", "K", "L", "N"],
        d2: ["C", "F", "G", "H", "K", "L", "O"],
        px: [10, 20, 30, 40, 50, 60, 70],
      },
    })

    const target = ColumnDataSource.create({
      data: {
        row_indices: [],
        labels: [],
      },
    })

    const formatter = StringFormatter.create({font_style: {value: "bold"}})

    const columns = [
      TableColumn.create({field: "d2", title: "Name", width: 80, sortable: false, formatter}),
      TableColumn.create({field: "px", title: "Price", width: 40, sortable: false}),
    ]

    const grouping = [
      GroupingInfo.create({getter: "d0", aggregators: [SumAggregator.create({field_: "px"})]}),
      GroupingInfo.create({getter: "d1", aggregators: [SumAggregator.create({field_: "px"})]}),
    ]

    const cube = DataCube.create({source, columns, grouping, target, width: 400, height: 200})
    await display(cube)
  })

  it("should allow TeX on Divs with mathstrings", async () => {
    const obj = Div.create({
      text: `When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are
        $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$`,
    })

    await display(obj, [320, 120])
  })

  it("should allow TeX on Paragraph with mathstrings", async () => {
    const obj = Paragraph.create({
      text: `When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are
        $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$`,
    })

    await display(obj, [320, 120])
  })

  it("should not allow TeX on PreText with mathstrings", async () => {
    const obj = PreText.create({
      text: "When \\(a \\ne 0\\)",
    })

    await display(obj, [525, 75])
  })

  it("should not process TeX on Divs with mathstrings and disable_math=true", async () => {
    const obj = Div.create({
      text: `When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are
        $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$`,
      disable_math: true,
    })

    await display(obj, [320, 120])
  })

  it("should not process TeX on Divs with mathstrings and render_as_text=true", async () => {
    const obj = Div.create({
      text: `When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are
        $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$`,
      render_as_text: true,
    })

    await display(obj, [320, 120])
  })

  describe("should support LightDark widget", () => {
    it("with active=false and widgets following a dark color scheme", async () => {
      const light_dark = LightDark.create({active: false})
      const w0 = Button.create({label: "Button"})
      const w1 = Toggle.create({label: "Toggle"})
      const w2 = Dropdown.create({label: "Dropdown"})
      const w3 = CheckboxGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
      const w4 = RadioGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
      const w5 = CheckboxButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
      const w6 = RadioButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
      const w7 = TextInput.create({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
      const w8 = PasswordInput.create({value: "foo"})
      const w9 = AutocompleteInput.create({
        placeholder: "Enter value ...",
        completions: ["aaa", "aab", "aac", "baa", "caa"],
      })
      const w10 = MultiChoice.create({options: ["Option 1", "Option 2", "Option 3"]})
      const w11 = Select.create({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1"})
      const w12 = Slider.create({value: 10, start: 0, end: 100, step: 0.5})
      const w_columns = [
        column([light_dark, w0, w1, w2, w3, w4, w5, w6]),
        column([w5, w6, w7, w8, w9, w10, w11, w12]),
      ]
      const layout = Row.create({children: w_columns})
      await display(layout, [540, 350])
    })

    it("with active=false and widgets following a dark color scheme inside a layout with a stylesheet", async () => {
      const light_dark = LightDark.create({active: false})
      const w0 = Button.create({label: "Button"})
      const w1 = Toggle.create({label: "Toggle"})
      const w2 = Dropdown.create({label: "Dropdown"})
      const w3 = CheckboxGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
      const w4 = RadioGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
      const w5 = CheckboxButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
      const w6 = RadioButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
      const w7 = TextInput.create({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
      const w8 = PasswordInput.create({value: "foo"})
      const w9 = AutocompleteInput.create({
        placeholder: "Enter value ...",
        completions: ["aaa", "aab", "aac", "baa", "caa"],
      })
      const w10 = MultiChoice.create({options: ["Option 1", "Option 2", "Option 3"]})
      const w11 = Select.create({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1"})
      const w12 = Slider.create({value: 10, start: 0, end: 100, step: 0.5})
      const w_columns = [
        column([light_dark, w0, w1, w2, w3, w4, w5, w6]),
        column([w5, w6, w7, w8, w9, w10, w11, w12]),
      ]
      const layout = Row.create({children: w_columns, stylesheets: [":host { background-color: var(--background-color); }"]})
      await display(layout, [540, 350])
    })

    it("with active=true and widgets following a light color scheme", async () => {
      const light_dark = LightDark.create({active: true})
      const w0 = Button.create({label: "Button"})
      const w1 = Toggle.create({label: "Toggle"})
      const w2 = Dropdown.create({label: "Dropdown"})
      const w3 = CheckboxGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
      const w4 = RadioGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
      const w5 = CheckboxButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
      const w6 = RadioButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
      const w7 = TextInput.create({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
      const w8 = PasswordInput.create({value: "foo"})
      const w9 = AutocompleteInput.create({
        placeholder: "Enter value ...",
        completions: ["aaa", "aab", "aac", "baa", "caa"],
      })
      const w10 = MultiChoice.create({options: ["Option 1", "Option 2", "Option 3"]})
      const w11 = Select.create({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1"})
      const w12 = Slider.create({value: 10, start: 0, end: 100, step: 0.5})
      const w_columns = [
        column([light_dark, w0, w1, w2, w3, w4, w5, w6]),
        column([w5, w6, w7, w8, w9, w10, w11, w12]),
      ]
      const layout = Row.create({children: w_columns})
      await display(layout, [540, 350])
    })

    it("with active=null and widgets following the system color scheme", async () => {
      const light_dark = LightDark.create({active: null})
      const w0 = Button.create({label: "Button"})
      const w1 = Toggle.create({label: "Toggle"})
      const w2 = Dropdown.create({label: "Dropdown"})
      const w3 = CheckboxGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
      const w4 = RadioGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
      const w5 = CheckboxButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
      const w6 = RadioButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
      const w7 = TextInput.create({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
      const w8 = PasswordInput.create({value: "foo"})
      const w9 = AutocompleteInput.create({
        placeholder: "Enter value ...",
        completions: ["aaa", "aab", "aac", "baa", "caa"],
      })
      const w10 = MultiChoice.create({options: ["Option 1", "Option 2", "Option 3"]})
      const w11 = Select.create({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1"})
      const w12 = Slider.create({value: 10, start: 0, end: 100, step: 0.5})
      const w_columns = [
        column([light_dark, w0, w1, w2, w3, w4, w5, w6]),
        column([w5, w6, w7, w8, w9, w10, w11, w12]),
      ]
      const layout = Row.create({children: w_columns})
      await display(layout, [540, 350])
    })
  })
})

describe("Rows of widgets", () => {
  it.allowing(7)("should allow different content and fixed height", async () => {
    const w0 = TextInput.create({value: "Widget 1"})
    const w1 = TextInput.create({value: "Widget 2", height: 50})
    const row = Row.create({children: [w0, w1]})
    await display(row, [700, 100])
  })

  it("should allow DataTable to fill row", async () => {
    const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = TableColumn.create({field: "index", title: "Index"})
    const bar_col = TableColumn.create({field: "bar", title: "Bar"})
    const columns = [index_col, bar_col]
    const table = DataTable.create({source, columns, autosize_mode: "fit_columns", sizing_mode: "stretch_both"})
    const row = Row.create({children: [table], width: 400, height: 100})
    await display(row, [400, 100])
  })
})
