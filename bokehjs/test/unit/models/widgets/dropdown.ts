import {expect, expect_instanceof} from "#framework/assertions"
import {display} from "#framework/layouts"

import {Dropdown} from "@bokehjs/models/widgets"
import {MenuView} from "@bokehjs/models/ui/menus/menu"
import {build_view} from "@bokehjs/core/build_views"

describe("DropdownView", () => {
  it("should remove the previous menu view when 'menu' changes", async () => {
    const dropdown = new Dropdown({label: "Dropdown", menu: ["A", "B"]})
    const {view} = await display(dropdown, [200, 100])

    const menu_view = view.children_views().find((child) => child instanceof MenuView)
    expect_instanceof(menu_view, MenuView)

    dropdown.menu = ["C", "D"]
    await view.ready

    expect(menu_view.is_destroyed).to.be.true
  })

  it("should remove its menu view when removed", async () => {
    const dropdown = new Dropdown({label: "Dropdown", menu: ["A", "B"]})
    const view = await build_view(dropdown)

    const menu_view = view.children_views().find((child) => child instanceof MenuView)
    expect_instanceof(menu_view, MenuView)

    view.remove()
    expect(menu_view.is_destroyed).to.be.true
  })
})
