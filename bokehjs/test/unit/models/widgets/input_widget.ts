import {expect, expect_not_null} from "#framework/assertions"
import {display} from "#framework/layouts"

import {TextInput} from "@bokehjs/models/widgets"
import {HTML} from "@bokehjs/models/dom/html"
import {Tooltip} from "@bokehjs/models/ui/tooltip"
import type {HasProps} from "@bokehjs/core/has_props"
import type {View} from "@bokehjs/core/view"

describe("InputWidgetView", () => {
  function child_view_of(view: View, model: HasProps): View | null {
    return view.children_views().find((child) => child?.model == model) ?? null
  }

  it("should remove the previous title view when 'title' changes", async () => {
    const title = new HTML({html: "title"})
    const input = new TextInput({title})
    const {view} = await display(input, [200, 50])

    const title_view = child_view_of(view, title)
    expect_not_null(title_view)

    input.title = new HTML({html: "other title"})
    await view.ready

    expect(title_view.is_destroyed).to.be.true
  })

  it("should remove the previous description view when 'description' changes", async () => {
    const description = new Tooltip({content: "description", position: "bottom_center"})
    const input = new TextInput({description})
    const {view} = await display(input, [200, 50])

    const description_view = child_view_of(view, description)
    expect_not_null(description_view)

    input.description = new Tooltip({content: "other description", position: "bottom_center"})
    await view.ready

    expect(description_view.is_destroyed).to.be.true
  })
})
