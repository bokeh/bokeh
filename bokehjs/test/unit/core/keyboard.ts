import {expect} from "#framework/assertions"

import {KeyCombination, parse, unparse} from "@bokehjs/core/keyboard"

describe("core/keyboard module", () => {
  const none = {ctrl: false, shift: false, alt: false, meta: false}

  describe("should support parse()", () => {
    it("which parses plain keys", () => {
      expect(parse("s")).to.be.equal({key: "s", modifiers: none})
      expect(parse("ArrowLeft")).to.be.equal({key: "ArrowLeft", modifiers: none})
    })

    it("which treats Space as an alias of the space character", () => {
      expect(parse("Space")).to.be.equal({key: " ", modifiers: none})
      expect(parse("Ctrl+Space")).to.be.equal(parse("Ctrl+ "))
    })

    it("which parses modifiers, including Meta", () => {
      expect(parse("Ctrl+s")).to.be.equal({key: "s", modifiers: {...none, ctrl: true}})
      expect(parse("Meta+s")).to.be.equal({key: "s", modifiers: {...none, meta: true}})
      expect(parse("Ctrl+Shift+Alt+Meta+s")).to.be.equal({key: "s", modifiers: {ctrl: true, shift: true, alt: true, meta: true}})
    })

    it("which implies Shift for upper-like keys", () => {
      expect(parse("S")).to.be.equal({key: "S", modifiers: {...none, shift: true}})
      expect(parse("Meta+:")).to.be.equal({key: ":", modifiers: {...none, shift: true, meta: true}})
    })
  })

  describe("should support unparse()", () => {
    it("which emits modifiers in canonical order", () => {
      const modifiers = {ctrl: true, shift: true, alt: true, meta: true}
      expect(unparse({key: "s", modifiers})).to.be.equal("Ctrl+Shift+Alt+Meta+s")
      expect(unparse({key: "s", modifiers: {...none, meta: true}})).to.be.equal("Meta+s")
    })

    it("which round-trips with parse() for all key combinations", () => {
      // compare key states, not strings, because some combinations are aliases,
      // e.g. "Shift+A" and "A", or "Ctrl+ " and "Ctrl+Space"
      for (const key_combination of KeyCombination) {
        const key_state = parse(key_combination)
        expect(parse(unparse(key_state))).to.be.equal(key_state)
      }
    })
  })
})
