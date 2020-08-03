import {display, row} from "./utils"

import {range} from "@bokehjs/core/util/array"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

import {
  Button, Toggle, Dropdown,
  CheckboxGroup, RadioGroup,
  CheckboxButtonGroup, RadioButtonGroup,
  TextInput, AutocompleteInput,
  Select, MultiSelect,
  Slider, RangeSlider, DateSlider, DateRangeSlider,
  DatePicker,
  Paragraph, Div, PreText,
} from "@bokehjs/models/widgets"

import {DataTable, TableColumn} from "@bokehjs/models/widgets/tables"

describe("Widgets", () => {
  it("should allow Button", async () => {
    const obj = new Button({label: "Button 1", button_type: "primary"})
    await display(obj, [500, 100])
  })

  it.allowing(6)("should allow Toggle", async () => {
    const obj = new Toggle({label: "Toggle 1", button_type: "primary"})
    await display(obj, [500, 100])
  })

  it.allowing(31)("should allow Dropdown", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = new Dropdown({label: "Dropdown 1", button_type: "primary", menu})
    await display(obj, [500, 100])
  })

  it.allowing(33)("should allow split Dropdown", async () => {
    const menu = ["Item 1", "Item 2", null, "Item 3"]
    const obj = new Dropdown({label: "Dropdown 2", button_type: "primary", menu, split: true})
    await display(obj, [500, 100])
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

  it.allowing(9)("should allow RadioButtonGroup", async () => {
    const obj = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
    await display(obj, [500, 100])
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

  it.allowing(8)("should allow Select", async () => {
    const obj = new Select({options: ["Option 1", "Option 2", "Option 3"]})
    await display(obj, [500, 100])
  })

  it.allowing(8)("should allow MultiSelect", async () => {
    const options = range(16).map((i) => `Option ${i+1}`)
    const obj = new MultiSelect({options, size: 6})
    await display(obj, [500, 150])
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

  it("should allow Div", async () => {
    const obj = new Div({text: "some <b>text</b>"})
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
})

describe("Rows of widgets", () => {

  it.allowing(7)("should allow different content and fixed height", async () => {
    const w0 = new TextInput({value: "Widget 1"})
    const w1 = new TextInput({value: "Widget 2", height: 50})
    const layout = row([w0, w1])
    await display(layout, [500, 100])
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
