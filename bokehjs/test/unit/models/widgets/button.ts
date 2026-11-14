import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {Button} from "@bokehjs/models/widgets"
import {HTML, HTMLView} from "@bokehjs/models/dom/html"

describe("ButtonView", () => {
  it("should render a string label as plain text", async () => {
    const button = Button.create({label: "<b>label</b>"})
    const {view} = await display(button, [200, 100])

    expect(view.button_el.textContent).to.be.equal("<b>label</b>")
    expect(view.children_views().some((child) => child instanceof HTMLView)).to.be.false
  })

  it("should update when 'label' changes", async () => {
    const button = Button.create({label: "label0"})
    const {view} = await display(button, [200, 100])

    button.label = "label1"
    await view.ready
    expect(view.button_el.textContent).to.be.equal("label1")

    button.label = HTML.create({html: "<b>label2</b>"})
    await view.ready
    expect(view.button_el.querySelector("b")?.textContent).to.be.equal("label2")

    const html_view = view.children_views().find((child) => child instanceof HTMLView)
    expect(html_view).to.not.be.undefined

    button.label = "label3"
    await view.ready
    expect(view.button_el.textContent).to.be.equal("label3")
    expect(html_view?.is_destroyed).to.be.true
  })
})
