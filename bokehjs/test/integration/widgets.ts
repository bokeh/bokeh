import {display, row, column} from "./_util"

import {range} from "@bokehjs/core/util/array"
import {ButtonType} from "@bokehjs/core/enums"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

import {
  Button, Toggle, Dropdown,
  Switch,
  CheckboxGroup, RadioGroup,
  CheckboxButtonGroup, RadioButtonGroup,
  TextInput, AutocompleteInput, TextAreaInput, FileInput,
  Select, MultiSelect,
  Slider, RangeSlider, DateSlider, DateRangeSlider,
  DatePicker,
  Paragraph, Div, PreText,
} from "@bokehjs/models/widgets"

import {DataTable, TableColumn} from "@bokehjs/models/widgets/tables"

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

    const button = view.shadow_el.querySelector("button")!
    const {left, top} = button.getBoundingClientRect()

    const ev = new MouseEvent("click", {clientX: left + 5, clientY: top + 5})
    button.dispatchEvent(ev)

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

    const toggle = view.shadow_el.querySelector(".bk-dropdown-toggle")!
    const {left, top} = toggle.getBoundingClientRect()

    const ev = new MouseEvent("click", {clientX: left + 5, clientY: top + 5})
    toggle.dispatchEvent(ev)

    await view.ready
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

  it.allowing(8)("should allow AutocompleteInput", async () => {
    const completions = ["aaa", "aab", "aac", "baa", "caa"]
    const obj = new AutocompleteInput({placeholder: "Enter value ...", completions})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow TextAreaInput", async () => {
    const obj = new TextAreaInput({placeholder: "Enter text ...", cols: 20, rows: 4})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow FileInput", async () => {
    const obj = new FileInput({accept: ".csv,.json.,.txt", multiple: false})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow Select", async () => {
    const obj = new Select({options: ["Option 1", "Option 2", "Option 3"]})
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

  it.allowing(8)("should allow DatePicker", async () => {
    const obj = new DatePicker({value: new Date(Date.UTC(2017, 8, 1)).toDateString()})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow DatePicker with dialog open", async () => {
    const obj = new DatePicker({value: new Date(Date.UTC(2017, 8, 1)).toDateString()})
    const {view} = await display(obj, [500, 400])

    const input_el = view.shadow_el.querySelector(".bk-input")!
    const {left, top} = input_el.getBoundingClientRect()

    const ev = new MouseEvent("click", {clientX: left + 5, clientY: top + 5})
    input_el.dispatchEvent(ev)

    await view.ready

    async function finished_animating(el: Element) {
      return new Promise<void>((resolve, reject) => {
        el.addEventListener("animationend", () => resolve(), {once: true})
        el.addEventListener("animationcancel", () => reject(), {once: true})
      })
    }

    const calendar_el = view.shadow_el.querySelector(".flatpickr-calendar")!
    await finished_animating(calendar_el)
  })

  it("should allow Div", async () => {
    const obj = new Div({text: "some <b>text</b>"})
    await display(obj, [500, 100])
  })

  it("should allow Div with float children", async () => {
    const html = 'Some <b>bold text<b/>.<div style="float: left; width: 40px; height: 40px; background-color: red"></div>'
    const obj = new Div({text: html, style: {border: "1px dotted blue", padding: "5px"}})
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

  it("should allow DataTable in fit_viewport mode", async () => {
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
    const layout = row([w0, w1])
    await display(layout, [700, 100])
  })

  it("should allow DataTable to fill row", async () => {
    const source = new ColumnDataSource({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
    const index_col = new TableColumn({field: "index", title: "Index"})
    const bar_col = new TableColumn({field: "bar", title: "Bar"})
    const columns = [index_col, bar_col]
    const table = new DataTable({source, columns, autosize_mode: "fit_columns", sizing_mode: "stretch_both"})
    const layout = row([table], {width: 400, height: 100})
    await display(layout, [400, 100])
  })
})
