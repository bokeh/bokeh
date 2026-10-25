import {expect, expect_not_null} from "#framework/assertions"
import {display, fig} from "#framework/layouts"
import {show_context_menu} from "#framework/interactive"

import {PanTool, CustomAction} from "@bokehjs/models"

describe("Toolbar", () => {
  it("should use tools' labels and descriptions in buttons and context menu (issue #15553)", async () => {
    const tools = [
      PanTool.create(),
      PanTool.create({label: "Drag", description: "Drag the plot around"}),
      PanTool.create({label: "Drag X", dimensions: "width"}),
      CustomAction.create(),
      CustomAction.create({label: "My Action"}),
      CustomAction.create({label: "Other Action", description: "Perform other action"}),
    ]

    const p = fig([300, 300], {tools, toolbar_location: "right"})
    p.scatter([1, 2, 3], [1, 2, 3], {size: 15})

    const {view} = await display(p)

    const menu_view = show_context_menu(view, 50, 50)
    await view.ready

    expect_not_null(menu_view)
    expect(menu_view.is_open).to.be.true

    const {item_entries} = menu_view
    const labels = item_entries.map(({label_el}) => label_el.textContent)
    const titles = item_entries.map(({el}) => el.title)

    expect(labels).to.be.equal([
      "Pan",
      "Drag",
      "Drag X",
      "Custom Action",
      "My Action",
      "Other Action",
    ])
    expect(titles).to.be.equal([
      "",
      "Drag the plot around",
      "Drag X (x-axis)",
      "Perform a Custom Action",
      "Perform a Custom Action",
      "Perform other action",
    ])

    const toolbar_view = view.owner.get_one(p.toolbar)
    const tooltips = toolbar_view.tool_button_views.map((button_view) => button_view.el.title)

    expect(tooltips).to.be.equal([
      "Pan",
      "Drag the plot around",
      "Drag X (x-axis)",
      "Perform a Custom Action",
      "Perform a Custom Action",
      "Perform other action",
    ])
  })
})
