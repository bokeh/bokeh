import {display, column} from "./_util"
import {click, mouse_click} from "../interactive"
import {expect_not_null} from "../unit/assertions"

import {range} from "@bokehjs/core/util/array"
import {ButtonType} from "@bokehjs/core/enums"
import type {Color} from "@bokehjs/core/types"

import {ColumnDataSource, Row} from "@bokehjs/models"

import {
  Button, Toggle, Dropdown,
  Checkbox, Switch,
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
        yield new Button({
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
    const obj = new Toggle({label: "Toggle 1", button_type: "primary"})
    await display(obj, [500, 100])
  })

  it("should allow Dropdown", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = new Dropdown({label: "Dropdown 1", button_type: "primary", menu})
    await display(obj, [500, 100])
  })

  it("should allow Dropdown with menu open", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = new Dropdown({label: "Dropdown 1", button_type: "primary", menu})
    const {view} = await display(obj, [500, 200])

    const button_el = view.shadow_el.querySelector("button")
    expect_not_null(button_el)

    await mouse_click(button_el)
    await view.ready
  })

  it("should allow split Dropdown", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = new Dropdown({label: "Dropdown 2", button_type: "primary", menu, split: true})
    await display(obj, [500, 100])
  })

  it("should allow split Dropdown with menu open", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = new Dropdown({label: "Dropdown 1", button_type: "primary", menu, split: true})
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
      const obj = new PaletteSelect({value: "RdBu", items})
      const {view} = await display(obj, [250, 400])

      await click(view.input_el)
      await view.ready
    })

    it("with ncols=3", async () => {
      const obj = new PaletteSelect({value: "Magma", items, ncols: 3})
      const {view} = await display(obj, [500, 200])

      await click(view.input_el)
      await view.ready
    })

    it("with disabled=true", async () => {
      const obj = new PaletteSelect({value: "Accent", items, disabled: true})
      const {view} = await display(obj, [250, 50])

      await click(view.input_el)
      await view.ready
    })
  })

  it("should allow Checkbox with active=false", async () => {
    const obj = new Checkbox({active: false, label: "Inactive checkbox"})
    await display(obj, [500, 50])
  })

  it("should allow Checkbox with active=true", async () => {
    const obj = new Checkbox({active: true, label: "Active checkbox"})
    await display(obj, [500, 50])
  })

  it("should allow Switch with active=false", async () => {
    const obj = new Switch({active: false})
    await display(obj, [500, 50])
  })

  it("should allow Switch with active=true", async () => {
    const obj = new Switch({active: true})
    await display(obj, [500, 50])
  })

  it("should allow CheckboxGroup", async () => {
    const obj = new CheckboxGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
    await display(obj, [500, 100])
  })

  it("should allow RadioGroup", async () => {
    const obj = new RadioGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
    await display(obj, [500, 100])
  })

  it.allowing(9)("should allow CheckboxButtonGroup", async () => {
    const obj = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
    await display(obj, [500, 100])
  })

  it.allowing(9)("should allow CheckboxButtonGroup in vertical orientation", async () => {
    const obj = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], orientation: "vertical"})
    await display(obj, [100, 150])
  })

  it.allowing(9)("should allow RadioButtonGroup", async () => {
    const obj = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
    await display(obj, [500, 100])
  })

  it.allowing(9)("should allow RadioButtonGroup in vertical orientation", async () => {
    const obj = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0, orientation: "vertical"})
    await display(obj, [100, 150])
  })

  it.allowing(8)("should allow TextInput", async () => {
    const obj = new TextInput({placeholder: "Enter value ..."})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextInput with prefix", async () => {
    const obj = new TextInput({placeholder: "Enter temperature ...", prefix: "T"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextInput with suffix", async () => {
    const obj = new TextInput({placeholder: "Enter temperature ...", suffix: "\u2103"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextInput with prefix and suffix", async () => {
    const obj = new TextInput({placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextInput with title, prefix and suffix", async () => {
    const obj = new TextInput({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow PasswordInput", async () => {
    const obj = new PasswordInput({value: "foo"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow PasswordInput with password visible", async () => {
    const obj = new PasswordInput({value: "foo"})
    const {view} = await display(obj, [500, 100])
    await mouse_click(view.toggle_el)
  })

  it.allowing(8)("should allow AutocompleteInput", async () => {
    const completions = ["aaa", "aab", "aac", "baa", "caa"]
    const obj = new AutocompleteInput({placeholder: "Enter value ...", completions})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow AutocompleteInput with min_characters==0 and completions showed on focusin", async () => {
    const completions = ["aaa", "aab", "aac", "baa", "caa"]
    const obj = new AutocompleteInput({placeholder: "Enter value ...", completions, min_characters: 0})
    const {view} = await display(obj, [500, 300])
    const ev = new FocusEvent("focusin")
    view.input_el.dispatchEvent(ev)
    await view.ready
  })

  it.allowing(8)("should allow TextAreaInput", async () => {
    const obj = new TextAreaInput({placeholder: "Enter text ...", cols: 20, rows: 4})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow FileInput", async () => {
    const obj = new FileInput({accept: ".csv,.json.,.txt", multiple: false})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow MultiChoice", async () => {
    const obj = new MultiChoice({options: ["Option 1", "Option 2", "Option 3"], value: ["Option 1", "Option 3"]})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow MultiChoice with empty value", async () => {
    const obj = new MultiChoice({options: ["Option 1", "Option 2", "Option 3"]})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow Select", async () => {
    const obj = new Select({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow Select with empty value", async () => {
    const obj = new Select({options: ["Option 1", "Option 2", "Option 3"]})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow Select with non-string options", async () => {
    const obj = new Select({options: [[10, "Option 1"], [20, "Option 2"], [30, "Option 3"]], value: 10})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow MultiSelect", async () => {
    const options = range(16).map((i) => `Option ${i+1}`)
    const obj = new MultiSelect({options, size: 6})
    await display(obj, [500, 150])
  })

  it("should allow Slider with math text string on title", async () => {
    const obj = new Slider({title: "$$\\mu$$", value: 10, start: 0, end: 100, step: 0.5})
    await display(obj, [500, 100])
  })

  it("should allow Slider", async () => {
    const obj = new Slider({value: 10, start: 0, end: 100, step: 0.5})
    await display(obj, [500, 100])
  })

  it("should allow DateSlider", async () => {
    const obj = new DateSlider({
      value: Date.UTC(2016, 1, 1),
      start: Date.UTC(2015, 1, 1),
      end: Date.UTC(2017, 12, 31),
    })
    await display(obj, [500, 100])
  })

  it("should allow RangeSlider", async () => {
    const obj = new RangeSlider({value: [10, 90], start: 0, end: 100, step: 0.5})
    await display(obj, [500, 100])
  })

  it("should allow DateRangeSlider", async () => {
    const obj = new DateRangeSlider({
      value: [Date.UTC(2016, 1, 1), Date.UTC(2016, 12, 31)],
      start: Date.UTC(2015, 1, 1),
      end: Date.UTC(2017, 12, 31),
    })
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow CategoricalSlider", async () => {
    const obj = new CategoricalSlider({categories: ["a", "b", "c", "d"], value: "b"})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow DatePicker", async () => {
    const d0 = "2023-01-18"
    const obj = new DatePicker({value: d0, width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow DateRangePicker", async () => {
    const d0 = "2023-01-18"
    const d1 = "2023-01-23"
    const obj = new DateRangePicker({value: [d0, d1], width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow MultipleDatePicker", async () => {
    const d0 = "2023-01-18"
    const d1 = "2023-01-23"
    const d2 = "2023-01-24"
    const d3 = "2023-01-27"
    const obj = new MultipleDatePicker({value: [d0, d1, d2, d3], width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow DatetimePicker", async () => {
    const d0 = "2023-01-18T09:37:52"
    const obj = new DatetimePicker({value: d0, width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow DatetimeRangePicker", async () => {
    const d0 = "2023-01-18T09:37:52"
    const d1 = "2023-01-23T20:17:25"
    const obj = new DatetimeRangePicker({value: [d0, d1], width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow MultipleDatetimePicker", async () => {
    const d0 = "2023-01-18T09:37:52"
    const d1 = "2023-01-23T20:17:25"
    const d2 = "2023-01-24T15:00:00"
    const d3 = "2023-01-27T03:59:59"
    const obj = new MultipleDatetimePicker({value: [d0, d1, d2, d3], width: 400})
    const {view} = await display(obj, [500, 400])
    await open_picker(view)
  })

  it.allowing(8)("should allow TimePicker", async () => {
    const t0 = "09:37:52"
    const obj = new TimePicker({value: t0})
    const {view} = await display(obj, [500, 150])
    await open_picker(view)
  })

  it.allowing(8)("should allow TimePicker with seconds", async () => {
    const t0 = "09:37:52"
    const obj = new TimePicker({value: t0, time_format: "H:i:S", seconds: true})
    const {view} = await display(obj, [500, 150])
    await open_picker(view)
  })

  it.allowing(8)("should allow TimePicker with seconds and 12h clock", async () => {
    const t0 = "09:37:52"
    const obj = new TimePicker({value: t0, time_format: "H:i:S", seconds: true, clock: "12h"})
    const {view} = await display(obj, [500, 150])
    await open_picker(view)
  })

  it("should allow Div", async () => {
    const obj = new Div({text: "some <b>text</b>"})
    await display(obj, [500, 100])
  })

  it("should allow Div with float children", async () => {
    const html = 'Some <b>bold text<b/>.<div style="float: left; width: 40px; height: 40px; background-color: red"></div>'
    const obj = new Div({text: html, styles: {border: "1px dotted blue", padding: "5px"}})
    await display(obj, [500, 100])
  })

  it("should allow Paragraph", async () => {
    const obj = new Paragraph({text: "some text"})
    await display(obj, [500, 100])
  })

  it("should allow PreText", async () => {
    const obj = new PreText({text: "some text"})
    await display(obj, [500, 100])
  })

  it("should allow DataTable in force_fit mode", async () => {
    const source = new ColumnDataSource({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = new TableColumn({field: "index", title: "Index"})
    const bar_col = new TableColumn({field: "bar", title: "Bar"})
    const columns = [index_col, bar_col]
    const table = new DataTable({source, columns, autosize_mode: "force_fit"})
    await display(table, [600, 400])
  })

  it("should allow DataTable in fit_columns mode", async () => {
    const source = new ColumnDataSource({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = new TableColumn({field: "index", title: "Index"})
    const bar_col = new TableColumn({field: "bar", title: "Bar"})
    const columns = [index_col, bar_col]
    const table = new DataTable({source, columns, autosize_mode: "fit_columns"})
    await display(table, [600, 400])
  })

  // TODO: fit_viewport needs a redesign
  // TODO: add support for xfail()
  it.skip("should allow DataTable in fit_viewport mode", async () => {
    const source = new ColumnDataSource({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = new TableColumn({field: "index", title: "Index"})
    const bar_col = new TableColumn({field: "bar", title: "Bar"})
    const columns = [index_col, bar_col]
    const table = new DataTable({source, columns, autosize_mode: "fit_viewport"})
    await display(table, [600, 400])
  })

  it("should allow DataTable in none mode", async () => {
    const source = new ColumnDataSource({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = new TableColumn({field: "index", title: "Index", width: 200})
    const bar_col = new TableColumn({field: "bar", title: "Bar", width: 350})
    const columns = [index_col, bar_col]
    const table = new DataTable({source, columns, autosize_mode: "none"})
    await display(table, [600, 400])
  })

  it("should allow DataTable to toggle column visibility", async () => {
    const source = new ColumnDataSource({data: {index: [0, 1, 2, 10], foo: [10, 20, 30, 40], bar: [3.4, 1.2, 0, -10]}})
    const index_col = new TableColumn({field: "index", title: "Index", width: 200})
    const foo_col = new TableColumn({field: "foo", title: "Foo", width: 350})
    const bar_col = new TableColumn({field: "bar", title: "Bar", width: 350})
    const columns = [index_col, foo_col, bar_col]
    const table = new DataTable({source, columns, autosize_mode: "none"})
    const {view} = await display(table, [600, 400])
    foo_col.visible = false
    await view.ready
  })

  it("should allow DataCube", async () => {
    const source = new ColumnDataSource({
      data: {
        d0: ["A", "E", "E", "E", "J", "L", "M"],
        d1: ["B", "D", "D", "H", "K", "L", "N"],
        d2: ["C", "F", "G", "H", "K", "L", "O"],
        px: [10, 20, 30, 40, 50, 60, 70],
      },
    })

    const target = new ColumnDataSource({
      data: {
        row_indices: [],
        labels: [],
      },
    })

    const formatter = new StringFormatter({font_style: "bold"})

    const columns = [
      new TableColumn({field: "d2", title: "Name", width: 80, sortable: false, formatter}),
      new TableColumn({field: "px", title: "Price", width: 40, sortable: false}),
    ]

    const grouping = [
      new GroupingInfo({getter: "d0", aggregators: [new SumAggregator({field_: "px"})]}),
      new GroupingInfo({getter: "d1", aggregators: [new SumAggregator({field_: "px"})]}),
    ]

    const cube = new DataCube({source, columns, grouping, target, width: 400, height: 200})
    await display(cube)
  })

  it("should allow TeX on Divs with mathstrings", async () => {
    const obj = new Div({
      text: `When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are
        $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$`,
    })

    await display(obj, [320, 120])
  })

  it("should allow TeX on Paragraph with mathstrings", async () => {
    const obj = new Paragraph({
      text: `When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are
        $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$`,
    })

    await display(obj, [320, 120])
  })

  it("should not allow TeX on PreText with mathstrings", async () => {
    const obj = new PreText({
      text: "When \\(a \\ne 0\\)",
    })

    await display(obj, [525, 75])
  })

  it("should not process TeX on Divs with mathstrings and disable_math=true", async () => {
    const obj = new Div({
      text: `When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are
        $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$`,
      disable_math: true,
    })

    await display(obj, [320, 120])
  })

  it("should not process TeX on Divs with mathstrings and render_as_text=true", async () => {
    const obj = new Div({
      text: `When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are
        $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$`,
      render_as_text: true,
    })

    await display(obj, [320, 120])
  })
})

describe("Rows of widgets", () => {
  it.allowing(7)("should allow different content and fixed height", async () => {
    const w0 = new TextInput({value: "Widget 1"})
    const w1 = new TextInput({value: "Widget 2", height: 50})
    const row = new Row({children: [w0, w1]})
    await display(row, [700, 100])
  })

  it("should allow DataTable to fill row", async () => {
    const source = new ColumnDataSource({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = new TableColumn({field: "index", title: "Index"})
    const bar_col = new TableColumn({field: "bar", title: "Bar"})
    const columns = [index_col, bar_col]
    const table = new DataTable({source, columns, autosize_mode: "fit_columns", sizing_mode: "stretch_both"})
    const row = new Row({children: [table], width: 400, height: 100})
    await display(row, [400, 100])
  })
})
