import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"
import {display} from "#framework/layouts"

import {KeyboardShortcuts, KeyboardShortcutsView} from "@bokehjs/models/ui/keyboard_shortcuts"
import {KeyBinding} from "@bokehjs/models/ui/key_binding"
import {Row} from "@bokehjs/models/layouts/row"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot} from "@bokehjs/models/plots/plot"

describe("KeyboardShortcuts", () => {
  describe("View", () => {
    it("should list key bindings of its source when laid out next to it", async () => {
      const plot = Plot.create({
        x_range: Range1d.create({start: 0, end: 10}),
        y_range: Range1d.create({start: 0, end: 10}),
        width: 300,
        height: 300,
        key_bindings: [
          KeyBinding.create({keys: "Ctrl+b", description: "Do something", action: () => {}}),
          // enough bindings for the list to be taller than the plot
          ...Array.from({length: 40}, (_, i) => KeyBinding.create({keys: "x", description: `Binding ${i}`, action: () => {}})),
        ],
      })
      plot.add_tools(PanTool.create())
      const shortcuts = KeyboardShortcuts.create({source: plot, styles: {max_height: "300px"}})
      const {view} = await display(Row.create({children: [plot, shortcuts]}), [1200, 800])

      const shortcuts_view = view.owner.get_one(shortcuts)
      expect_instanceof(shortcuts_view, KeyboardShortcutsView)

      const table_el = shortcuts_view.shadow_el.querySelector("table")
      expect_not_null(table_el)
      const text = table_el.textContent
      expect(text.includes("Do something")).to.be.true // plot's binding
      expect(text.includes("Pan left")).to.be.true     // tool's binding

      // the plot keeps its size and a long list of key bindings scrolls
      const plot_view = view.owner.get_one(plot)
      expect(plot_view.el.offsetWidth).to.be.equal(300)
      expect(plot_view.el.offsetHeight).to.be.equal(300)
      expect(shortcuts_view.el.offsetHeight).to.be.equal(300)
      expect(shortcuts_view.el.scrollHeight).to.be.above(300)
    })
  })
})
