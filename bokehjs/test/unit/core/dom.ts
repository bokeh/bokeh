import {expect} from "assertions"

import {div, input, has_focus} from "@bokehjs/core/dom"

describe("core/dom module", () => {
  it("support element constructors", () => {
    const el0 = div({id: "el0", style: "width: 100px; height: 200px; z-index: 1;"})
    expect(el0.isConnected).to.be.false
    expect(el0.id).to.be.equal("el0")
    expect(el0.style.width).to.be.equal("100px")
    expect(el0.style.height).to.be.equal("200px")
    expect(el0.style.zIndex).to.be.equal("1")

    const el1 = div({id: "el1", style: {width: "100px", height: "200px", zIndex: "1"}})
    expect(el1.isConnected).to.be.false
    expect(el1.id).to.be.equal("el1")
    expect(el1.style.width).to.be.equal("100px")
    expect(el1.style.height).to.be.equal("200px")
    expect(el1.style.zIndex).to.be.equal("1")
  })

  it("should support has_focus() function", () => {
    const el = input()
    document.body.append(el)
    expect(has_focus(el)).to.be.false
    el.focus()
    expect(has_focus(el)).to.be.true
    el.blur()
    expect(has_focus(el)).to.be.false
  })

  describe("support element constructors with styles", () => {
    it("using camel CSS property names", () => {
      const el = div({style: {borderTopLeftRadius: "1.5em"}})
      expect(el.style.borderTopLeftRadius).to.be.equal("1.5em")
    })

    it("using dashed CSS property names", () => {
      const el = div({style: {"border-top-left-radius": "1.5em"}})
      expect(el.style.borderTopLeftRadius).to.be.equal("1.5em")
    })

    it("using snake CSS property names", () => {
      const el = div({style: {border_top_left_radius: "1.5em"}})
      expect(el.style.borderTopLeftRadius).to.be.equal("1.5em")
    })
  })
})
