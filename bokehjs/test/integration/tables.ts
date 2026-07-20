import {display} from "#framework/layouts"
import {mouse_click} from "#framework/interactive"

import {ColumnDataSource, CustomJSCompare, NanCompare} from "@bokehjs/models"
import {DataTable, TableColumn} from "@bokehjs/models/widgets/tables"

describe("DataTable", () => {

  it("should allow sorting a non-selectable table", async () => {
    const source = new ColumnDataSource({data: {foo: [10, 20, 30, 40], bar: [3.4, 1.2, 0, -10]}})

    const foo_col = new TableColumn({field: "foo", title: "Foo", width: 200})
    const bar_col = new TableColumn({field: "bar", title: "Bar", width: 200})
    const columns = [foo_col, bar_col]

    const table = new DataTable({source, columns, sortable: true, selectable: false})
    const {view} = await display(table, [600, 400])

    const el = view.shadow_el.querySelectorAll(".slick-header-column")[2]
    await mouse_click(el)
    await view.ready
  })

  it("should allow sorting with a NanCompare", async () => {
    const source = new ColumnDataSource({data: {foo: [10, 20, 30, 40], bar: [3.4, NaN, 0, -10]}})

    const foo_col = new TableColumn({field: "foo", title: "Foo", width: 200})
    const bar_col = new TableColumn({field: "bar", title: "Bar", width: 200, sorter: new NanCompare()})
    const columns = [foo_col, bar_col]

    const table = new DataTable({source, columns, sortable: true})
    const {view} = await display(table, [600, 400])

    const el = view.shadow_el.querySelectorAll(".slick-header-column")[2]
    await mouse_click(el)
    await view.ready
  })

  it("should allow sorting with a CustomJSCompare", async () => {
    const source = new ColumnDataSource({data: {foo: [10, 20, 30, 40], bar: ["a 1", "a 10", "a 100", "a 2"]}})

    const foo_col = new TableColumn({field: "foo", title: "Foo", width: 200})

    const sorter = new CustomJSCompare({
      code: `
            const xn = Number(x.split(" ")[1])
            const yn = Number(y.split(" ")[1])
            return xn == yn ? 0 : (xn < yn ? -1 : 1)
         `,
    })
    const bar_col = new TableColumn({field: "bar", title: "Bar", width: 200, sorter})
    const columns = [foo_col, bar_col]

    const table = new DataTable({source, columns, sortable: true})
    const {view} = await display(table, [600, 400])

    const el = view.shadow_el.querySelectorAll(".slick-header-column")[2]
    await mouse_click(el)
    await view.ready
  })

  it("should create a horizontal scrollbar with autosize_mode='fit_columns' inside a narrow layout", async () => {
    const source = new ColumnDataSource({
      data: {
        text: ["something", "something"],
        number: [0.33, 0.33],
        other_number: [12345, 12345],
      },
    })

    const columns = [
      new TableColumn({field: "text", title: "Text"}),
      new TableColumn({field: "number", title: "Number"}),
      new TableColumn({field: "other_number", title: "Other number"}),
    ]

    const table = new DataTable({
      source,
      columns,
      width: 150,
      height: 200,
      autosize_mode: "fit_columns",
    })

    await display(table, [150, 200])
  })

  it("should leave whitespace when viewport exceeds total column width with autosize_mode='ignore_viewport'", async () => {
    const source = new ColumnDataSource({
      data: {
        text: ["something", "something"],
        number: [0.33, 0.33],
        other_number: [12345, 12345],
      },
    })

    const columns = [
      new TableColumn({field: "text", title: "Text"}),
      new TableColumn({field: "number", title: "Number"}),
      new TableColumn({field: "other_number", title: "Other number"}),
    ]

    const table = new DataTable({
      source,
      columns,
      width: 450,
      height: 200,
      autosize_mode: "ignore_viewport",
    })

    await display(table, [450, 200])
  })

})
