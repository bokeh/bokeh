import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"
import {fig, display} from "#framework/layouts"
import {tap, mouse_enter, mouse_leave, show_context_menu} from "#framework/interactive"

import {Toolbar} from "@bokehjs/models/tools/toolbar"
import type {ToolbarView} from "@bokehjs/models/tools/toolbar"
import {ToolGroup} from "@bokehjs/models/tools/tool_group"
import {HoverTool} from "@bokehjs/models/tools/inspectors/hover_tool"
import {SelectTool} from "@bokehjs/models/tools/gestures/select_tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {TapTool} from "@bokehjs/models/tools/gestures/tap_tool"
import {build_view} from "@bokehjs/core/build_views"
import {gridplot} from "@bokehjs/api/gridplot"
import {ExamineTool, UndoTool, Plot, CustomAction, Legend, LegendItem, CustomJS, Range1d} from "@bokehjs/models"
import * as tb_css from "@bokehjs/styles/tool_button.css"
import * as toolbar_css from "@bokehjs/styles/toolbar.css"
import * as logo_css from "@bokehjs/styles/logo.css"
import type {Size} from "@bokehjs/core/layout"
import type {Location} from "@bokehjs/core/enums"

describe("Toolbar", () => {

  describe("_active_change method", () => {
    let pan_1: PanTool
    let pan_2: PanTool
    let toolbar: Toolbar

    before_each(() => {
      // by default these tools are inactive
      pan_1 = PanTool.create()
      pan_2 = PanTool.create()
      toolbar = Toolbar.create()
      toolbar.gestures.pan.tools = [PanTool.create(), PanTool.create()]
    })

    it("should correctly activate tool with currently active tool", () => {
      pan_1.active = true
      toolbar._active_change(pan_1)
      expect(pan_1.active).to.be.true
      expect(pan_2.active).to.be.false
      expect(toolbar.gestures.pan.active).to.be.equal(pan_1)
    })

    it("should correctly deactivate tool", () => {
      // activate the tool as setup
      pan_1.active = true
      toolbar._active_change(pan_1)
      // now deactivate the tool
      pan_1.active = false
      toolbar._active_change(pan_1)
      expect(pan_1.active).to.be.false
      expect(pan_2.active).to.be.false
      expect(toolbar.gestures.pan.active).to.be.null
    })

    it("should correctly activate tool and deactivate currently active one", () => {
      // activate the tool as setup
      pan_1.active = true
      toolbar._active_change(pan_1)
      // now activate the other tool
      pan_2.active = true
      toolbar._active_change(pan_2)
      expect(pan_1.active).to.be.false
      expect(pan_2.active).to.be.true
      expect(toolbar.gestures.pan.active).to.be.equal(pan_2)
    })
  })

  describe("should support autohide=true", () => {
    it("in single plots", async () => {
      const p = fig([200, 200], {toolbar_location: "right"})
      p.toolbar.autohide = true
      p.rect({x: [0, 1], y: [0, 1], width: 1, height: 1, color: ["red", "blue"]})

      const {view} = await display(p)
      const toolbar_view = view.owner.get_one(p.toolbar)

      expect(toolbar_view.visible).to.be.false
      expect(toolbar_view.el.classList.contains("bk-hidden")).to.be.true

      await mouse_enter(view.el)
      expect(toolbar_view.visible).to.be.true
      expect(toolbar_view.el.classList.contains("bk-hidden")).to.be.false

      await mouse_leave(view.el)
      expect(toolbar_view.visible).to.be.false
      expect(toolbar_view.el.classList.contains("bk-hidden")).to.be.true
    })

    it("in grid plots", async () => {
      const p0 = fig([200, 200])
      p0.rect({x: [0, 1], y: [0, 1], width: 1, height: 1, color: ["red", "blue"]})
      const p1 = fig([200, 200])
      p1.rect({x: [0, 1], y: [0, 1], width: 1, height: 1, color: ["red", "blue"]})

      const gp = gridplot([[p0, p1]], {toolbar_location: "above"})
      gp.toolbar.autohide = true

      const {view} = await display(gp)
      const tbv = view.toolbar_view

      expect(tbv.visible).to.be.false
      expect(tbv.el.classList.contains("bk-hidden")).to.be.true

      await mouse_enter(view.el)
      expect(tbv.visible).to.be.true
      expect(tbv.el.classList.contains("bk-hidden")).to.be.false

      await mouse_leave(view.el)
      expect(tbv.visible).to.be.false
      expect(tbv.el.classList.contains("bk-hidden")).to.be.true
    })
  })

  describe("_init_tools method", () => {
    let hover_1: HoverTool
    let hover_2: HoverTool
    let hover_3: HoverTool

    before_each(() => {
      hover_1 = HoverTool.create()
      hover_2 = HoverTool.create()
      hover_3 = HoverTool.create()
    })

    it("should set inspect tools as array on Toolbar.inspector property", () => {
      const toolbar = Toolbar.create({tools: [hover_1, hover_2, hover_3]})
      expect(toolbar.inspectors).to.be.equal([hover_1, hover_2, hover_3])
    })

    it("should have all inspect tools active when active_inspect='auto'", () => {
      Toolbar.create({tools: [hover_1, hover_2, hover_3], active_inspect: "auto"})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.true
      expect(hover_3.active).to.be.true
    })

    it("should have arg inspect tool active when active_inspect=tool instance", () => {
      Toolbar.create({tools: [hover_1, hover_2, hover_3], active_inspect: hover_1})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.false
      expect(hover_3.active).to.be.false
    })

    it("should have args inspect tools active when active_inspect=Array(tools)", () => {
      Toolbar.create({tools: [hover_1, hover_2, hover_3], active_inspect: [hover_1, hover_2]})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.true
      expect(hover_3.active).to.be.false
    })

    it("should have none inspect tools active when active_inspect=null)", () => {
      Toolbar.create({tools: [hover_1, hover_2, hover_3], active_inspect: null})
      expect(hover_1.active).to.be.false
      expect(hover_2.active).to.be.false
      expect(hover_3.active).to.be.false
    })
  })
})

describe("ToolbarView", () => {

  describe("visible getter", () => {
    it("should be true if autohide is false and _visible isn't set", async () => {
      const tb = Toolbar.create()
      const tbv = await build_view(tb, {parent: null})
      expect(tbv.model.autohide).to.be.false
      expect(tbv.visible).to.be.true
    })

    it("should be true if autohide is false and _visible is true", async () => {
      const tb = Toolbar.create()
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(true)
      expect(tbv.model.autohide).to.be.false
      expect(tbv.visible).to.be.true
    })

    it("should be true if autohide is false and _visible is false", async () => {
      const tb = Toolbar.create()
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(false)
      expect(tbv.model.autohide).to.be.false
      expect(tbv.visible).to.be.true
    })

    it("should be false if autohide is true and _visible isn't set", async () => {
      const tb = Toolbar.create({autohide: true})
      const tbv = await build_view(tb, {parent: null})
      expect(tbv.model.autohide).to.be.true
      expect(tbv.visible).to.be.false
    })

    it("should be true if autohide is true and _visible is true", async () => {
      const tb = Toolbar.create({autohide: true})
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(true)
      expect(tbv.model.autohide).to.be.true
      expect(tbv.visible).to.be.true
    })

    it("should be false if autohide is true and _visible is false", async () => {
      const tb = Toolbar.create({autohide: true})
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(false)
      expect(tbv.model.autohide).to.be.true
      expect(tbv.visible).to.be.false
    })
  })

  describe("should allow activation and deactivation", () => {
    it("of ExamineTool", async () => {
      const tool = ExamineTool.create()
      const toolbar = Toolbar.create({tools: [tool]})
      const plot = Plot.create({toolbar})
      const {view} = await display(plot)
      const toolbar_view = view.owner.get_one(toolbar)
      const tool_view = view.owner.get_one(tool)
      const tool_button_view = toolbar_view.tool_button_views[0]
      expect(tool_button_view.model.tool.active).to.be.false
      expect(tool_view.dialog.model.visible).to.be.false
      tool_button_view.tap()
      await view.ready
      expect(tool_button_view.model.tool.active).to.be.true
      expect(tool_view.dialog.model.visible).to.be.true
      tool_button_view.tap()
      await view.ready
      expect(tool_button_view.model.tool.active).to.be.false
      expect(tool_view.dialog.model.visible).to.be.false
    })

    describe("of CustomAction", () => {
      async function test(initial: boolean, fn: (legend: Legend, tool: CustomAction) => void) {
        const legend = Legend.create({
          visible: initial,
          items: [
            LegendItem.create({label: "Label"}),
          ],
        })
        const tool = CustomAction.create({
          icon: ".bk-tool-icon-list",
          active: initial,
        })
        fn(legend, tool)
        const toolbar = Toolbar.create({tools: [tool]})
        const plot = Plot.create({
          toolbar,
          center: [legend],
          width: 200,
          height: 100,
          x_range: Range1d.create({start: 0, end: 1}),
          y_range: Range1d.create({start: 0, end: 1}),
        })
        const {view} = await display(plot)
        const toolbar_view = view.owner.get_one(toolbar)
        const tool_view = view.owner.get_one(tool)
        const tool_button_view = toolbar_view.tool_button_views[0]
        expect(tool_button_view.model.tool.active).to.be.equal(initial)
        expect(legend.visible).to.be.equal(initial)
        /**
          Alternatively `await tap(tool_button_view.el)`, but it's slow
          and unreliable (sometimes doesn't trigger, maybe due to page
          scrolling or something like that).
         */
        tool_button_view.tap()
        await tool_view.ready
        expect(tool_button_view.model.tool.active).to.be.equal(!initial)
        expect(legend.visible).to.be.equal(!initial)
        tool_button_view.tap()
        await tool_view.ready
        expect(tool_button_view.model.tool.active).to.be.equal(initial)
        expect(legend.visible).to.be.equal(initial)
      }

      describe("with JS callback and active_callback='auto'", () => {
        const fn = (legend: Legend, tool: CustomAction) => {
          tool.callback = () => {
            legend.visible = !legend.visible
          }
          tool.active_callback = "auto"
        }
        it("and Legend initially not visible", async () => {
          await test(false, fn)
        })
        it("and Legend initially visible", async () => {
          await test(true, fn)
        })
      })

      describe("with JS callback returning a boolean and active_callback=null", () => {
        const fn = (legend: Legend, tool: CustomAction) => {
          tool.callback = () => {
            legend.visible = !legend.visible
            return legend.visible
          }
          tool.active_callback = null
        }
        it("and Legend initially not visible", async () => {
          await test(false, fn)
        })
        it("and Legend initially visible", async () => {
          await test(true, fn)
        })
      })

      describe("with JS callbacks", () => {
        const fn = (legend: Legend, tool: CustomAction) => {
          tool.callback = () => {
            legend.visible = !legend.visible
          }
          tool.active_callback = () => {
            return legend.visible
          }
        }
        it("and Legend initially not visible", async () => {
          await test(false, fn)
        })
        it("and Legend initially visible", async () => {
          await test(true, fn)
        })
      })

      describe("with CustomJS callbacks", () => {
        const fn = (legend: Legend, tool: CustomAction) => {
          tool.callback = CustomJS.create({
            args: {legend},
            code: `
            export default ({legend}) => {
              legend.visible = !legend.visible
            }
            `,
          })
          tool.active_callback = CustomJS.create({
            args: {legend},
            code: `
            export default ({legend}) => {
              return legend.visible
            }
            `,
          })
        }
        it("and Legend initially not visible", async () => {
          await test(false, fn)
        })
        it("and Legend initially visible", async () => {
          await test(true, fn)
        })
      })
    })
  })

  describe("visible attribute with inspect tools", () => {
    it("should not show inspect tools if visible=false", async () => {
      const hover = HoverTool.create({visible: false})
      const tb = Toolbar.create({tools: [hover]})
      const {view: tbv} = await display(tb, [300, 300])

      expect(hover.visible).to.be.false
      expect(tbv.tool_button_views[0].class_list.has(tb_css.hidden)).to.be.true
    })

    it("should show inspect tools if visible=true", async () => {
      const hover = HoverTool.create({visible: true})
      const tb = Toolbar.create({tools: [hover]})
      const {view: tbv} = await display(tb, [300, 300])

      expect(hover.visible).to.be.true
      expect(tbv.tool_button_views[0].class_list.has(tb_css.hidden)).to.be.false
    })

    it("should show inspect tools if visible is not set", async () => {
      const hover = HoverTool.create()
      const tb = Toolbar.create({tools: [hover]})
      const {view: tbv} = await display(tb, [300, 300])

      expect(hover.visible).to.be.true
      expect(tbv.tool_button_views[0].class_list.has(tb_css.hidden)).to.be.false
    })
  })

  it("should update context menu when tools' labels change (issue #15553)", async () => {
    const pan = PanTool.create()
    const action = CustomAction.create({label: "My Action"})

    const p = fig([300, 300], {tools: [pan, action], toolbar_location: "right"})
    const {view} = await display(p)

    async function context_menu_labels(): Promise<(string | null)[]> {
      const menu_view = show_context_menu(view, 50, 50)
      await view.ready

      expect_not_null(menu_view)
      expect(menu_view.is_open).to.be.true

      const labels = menu_view.item_entries.map(({label_el}) => label_el.textContent)
      menu_view.hide()
      return labels
    }

    expect(await context_menu_labels()).to.be.equal(["Pan", "My Action"])

    pan.label = "Drag"
    action.label = "Other Action"
    await view.ready

    expect(await context_menu_labels()).to.be.equal(["Drag", "Other Action"])

    pan.label = null
    action.label = null
    await view.ready

    expect(await context_menu_labels()).to.be.equal(["Pan", "Custom Action"])
  })

  describe("should stop updating removed tool buttons", () => {
    async function setup() {
      const pan = PanTool.create()
      const toolbar = Toolbar.create({tools: [pan]})
      const {view} = await display(toolbar, [200, 100])

      const [bar_view] = view.tool_button_views
      const [menu_view] = view.tool_button_menu_views
      expect_not_null(bar_view)
      expect_not_null(menu_view)

      const updated: unknown[] = []
      const {button_updated} = view
      view.button_updated = (button_view) => {
        updated.push(button_view)
        button_updated.call(view, button_view)
      }

      // Sanity check that buttons update when the tool changes.
      pan.description = "Pan 1"
      await view.ready
      expect(updated.includes(bar_view)).to.be.true
      updated.length = 0

      return {pan, toolbar, view, bar_view, menu_view, updated}
    }

    it("when tools are replaced", async () => {
      const {pan, toolbar, view, bar_view, menu_view, updated} = await setup()

      toolbar.tools = []
      await view.ready

      pan.description = "Pan 2"
      await view.ready

      expect(updated.includes(bar_view)).to.be.false
      expect(updated.includes(menu_view)).to.be.false
    })

    it("when the toolbar is removed", async () => {
      const {pan, view, bar_view, menu_view, updated} = await setup()

      view.remove()

      pan.description = "Pan 2"
      await bar_view.ready
      await menu_view.ready

      expect(updated.includes(bar_view)).to.be.false
      expect(updated.includes(menu_view)).to.be.false
    })
  })

  describe("visible attribute of tools in toolbar", () => {

    it("should have correct visibility status of tools", () => {
      const hover = HoverTool.create()
      const pan = PanTool.create()
      const tap = TapTool.create()

      expect(hover.visible).to.be.true
      expect(pan.visible).to.be.true
      expect(tap.visible).to.be.true

      hover.visible = false
      expect(hover.visible).to.be.false
      expect(pan.visible).to.be.true
      expect(tap.visible).to.be.true

      pan.visible = false
      expect(hover.visible).to.be.false
      expect(pan.visible).to.be.false
      expect(tap.visible).to.be.true

      tap.visible = false
      expect(hover.visible).to.be.false
      expect(pan.visible).to.be.false
      expect(tap.visible).to.be.false
    })

    it("should not add tools with visible=false", async () => {
      const pan = PanTool.create({visible: false})
      const tap = TapTool.create()
      const hover = HoverTool.create({visible: false})

      const tb = Toolbar.create({tools: [pan, tap, hover]})
      const {view: tbv} = await display(tb, [300, 300])

      expect(tbv.tool_button_views[0].class_list.has(tb_css.hidden)).to.be.true
      expect(tbv.tool_button_views[1].class_list.has(tb_css.hidden)).to.be.false
      expect(tbv.tool_button_views[2].class_list.has(tb_css.hidden)).to.be.true
    })

    it("should have default tools all be visible", async () => {
      const pan = PanTool.create()
      const tap = TapTool.create()
      const hover = HoverTool.create()

      const tb = Toolbar.create({tools: [pan, tap, hover]})
      const {view: tbv} = await display(tb, [300, 300])

      expect(tbv.tool_button_views[0].class_list.has(tb_css.hidden)).to.be.false
      expect(tbv.tool_button_views[1].class_list.has(tb_css.hidden)).to.be.false
      expect(tbv.tool_button_views[2].class_list.has(tb_css.hidden)).to.be.false
    })

    it("should show no tools if all tools have visible=false", async () => {
      const pan = PanTool.create({visible: false})
      const tap = TapTool.create({visible: false})
      const hover = HoverTool.create({visible: false})

      const tb = Toolbar.create({tools: [pan, tap, hover]})
      const {view: tbv} = await display(tb, [300, 300])

      expect(tbv.tool_button_views[0].class_list.has(tb_css.hidden)).to.be.true
      expect(tbv.tool_button_views[1].class_list.has(tb_css.hidden)).to.be.true
      expect(tbv.tool_button_views[2].class_list.has(tb_css.hidden)).to.be.true
    })

    it("should properly show tools after changing visibility", async () => {
      const hover = HoverTool.create()
      const tb = Toolbar.create({tools: [hover]})
      const {view: tbv} = await display(tb, [300, 300])

      expect(tbv.tool_button_views[0].class_list.has(tb_css.hidden)).to.be.false

      hover.visible = false
      await tbv.ready

      expect(tbv.tool_button_views[0].class_list.has(tb_css.hidden)).to.be.true

      hover.visible = true
      await tbv.ready

      expect(tbv.tool_button_views[0].class_list.has(tb_css.hidden)).to.be.false
    })
  })

  describe("should support tool grouping", () => {
    it("and should group tools when Toolbar.group == true", async () => {
      const pan0 = PanTool.create()
      const pan1 = PanTool.create()
      const tap0 = TapTool.create()
      const tap1 = TapTool.create()
      const tap2 = TapTool.create()
      const hover0 = HoverTool.create()
      const hover1 = HoverTool.create()
      const hover2 = HoverTool.create()

      const tb = Toolbar.create({
        tools: [pan0, pan1, tap0, tap1, tap2, hover0, hover1, hover2],
        group: true,
      })
      const tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.length).to.be.equal(6)

      expect(tbv.tool_buttons[0].tool).to.be.equal(pan0)
      expect(tbv.tool_buttons[1].tool).to.be.equal(pan1)
      expect(tbv.tool_buttons[2].tool).to.be.equal(tap0)
      expect(tbv.tool_buttons[3].tool).to.be.equal(tap1)
      expect(tbv.tool_buttons[4].tool).to.be.equal(tap2)

      expect_instanceof(tbv.tool_buttons[5].tool, ToolGroup)
      expect(tbv.tool_buttons[5].tool.tools).to.be.equal([hover0, hover1, hover2])
    })

    it("and should not group tools when Toolbar.group == false", async () => {
      const pan0 = PanTool.create()
      const pan1 = PanTool.create()
      const tap0 = TapTool.create()
      const tap1 = TapTool.create()
      const tap2 = TapTool.create()
      const hover0 = HoverTool.create()
      const hover1 = HoverTool.create()
      const hover2 = HoverTool.create()

      const tb = Toolbar.create({
        tools: [pan0, pan1, tap0, tap1, tap2, hover0, hover1, hover2],
        group: false,
      })
      const tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.map((button) => button.tool)).to.be.equal([pan0, pan1, tap0, tap1, tap2, hover0, hover1, hover2])
    })

    it("and should allow to configure which types of tools to group", async () => {
      const pan0 = PanTool.create()
      const pan1 = PanTool.create()
      const tap0 = TapTool.create()
      const tap1 = TapTool.create()
      const tap2 = TapTool.create()
      const hover0 = HoverTool.create()
      const hover1 = HoverTool.create()
      const hover2 = HoverTool.create()

      const tb = Toolbar.create({
        tools: [pan0, pan1, tap0, tap1, tap2, hover0, hover1, hover2],
        group: true,
        group_types: ["tap", "hover"],
      })
      const tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.length).to.be.equal(4)

      expect(tbv.tool_buttons[0].tool).to.be.equal(pan0)
      expect(tbv.tool_buttons[1].tool).to.be.equal(pan1)

      expect_instanceof(tbv.tool_buttons[2].tool, ToolGroup)
      expect(tbv.tool_buttons[2].tool.tools).to.be.equal([tap0, tap1, tap2])

      expect_instanceof(tbv.tool_buttons[3].tool, ToolGroup)
      expect(tbv.tool_buttons[3].tool.tools).to.be.equal([hover0, hover1, hover2])
    })

    it("and should allow to group tools by group name", async () => {
      const tap0 = TapTool.create({group: "A"})
      const tap1 = TapTool.create({group: "A"})
      const tap2 = TapTool.create({group: "A"})
      const tap3 = TapTool.create({group: "B"})
      const tap4 = TapTool.create({group: "B"})
      const tap5 = TapTool.create({group: "C"})
      const tap6 = TapTool.create({group: false})
      const tap7 = TapTool.create()
      const tap8 = TapTool.create()

      const hover0 = HoverTool.create()
      const hover1 = HoverTool.create()
      const hover2 = HoverTool.create({group: false})
      const hover3 = HoverTool.create({group: "A"})
      const hover4 = HoverTool.create({group: "A"})
      const hover5 = HoverTool.create()
      const hover6 = HoverTool.create({group: "A"})

      const tb = Toolbar.create({
        tools: [
          tap0, tap1, tap2, tap3, tap4, tap5, tap6, tap7, tap8,
          hover0, hover1, hover2, hover3, hover4, hover5, hover6,
        ],
        group: true,
        group_types: ["tap", "hover"],
      })
      const tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.length).to.be.equal(8)

      expect_instanceof(tbv.tool_buttons[0].tool, ToolGroup)
      expect(tbv.tool_buttons[0].tool.tools).to.be.equal([tap0, tap1, tap2])

      expect_instanceof(tbv.tool_buttons[1].tool, ToolGroup)
      expect(tbv.tool_buttons[1].tool.tools).to.be.equal([tap3, tap4])

      expect(tbv.tool_buttons[2].tool).to.be.equal(tap5)

      expect(tbv.tool_buttons[3].tool).to.be.equal(tap6)

      expect_instanceof(tbv.tool_buttons[4].tool, ToolGroup)
      expect(tbv.tool_buttons[4].tool.tools).to.be.equal([tap7, tap8])

      expect_instanceof(tbv.tool_buttons[5].tool, ToolGroup)
      expect(tbv.tool_buttons[5].tool.tools).to.be.equal([hover0, hover1, hover5])

      expect(tbv.tool_buttons[6].tool).to.be.equal(hover2)

      expect_instanceof(tbv.tool_buttons[7].tool, ToolGroup)
      expect(tbv.tool_buttons[7].tool.tools).to.be.equal([hover3, hover4, hover6])
    })

    it("and should allow to change Toolbar.group", async () => {
      const tap0 = TapTool.create()
      const tap1 = TapTool.create()
      const hover0 = HoverTool.create()
      const hover1 = HoverTool.create()
      const hover2 = HoverTool.create()

      const tb = Toolbar.create({
        tools: [tap0, tap1, hover0, hover1, hover2],
        group: true,
        group_types: ["hover"],
      })
      const tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.length).to.be.equal(3)

      expect(tbv.tool_buttons[0].tool).to.be.equal(tap0)
      expect(tbv.tool_buttons[1].tool).to.be.equal(tap1)

      expect_instanceof(tbv.tool_buttons[2].tool, ToolGroup)
      expect(tbv.tool_buttons[2].tool.tools).to.be.equal([hover0, hover1, hover2])

      tb.group = false
      await tbv.ready

      expect(tbv.tool_buttons.map((button) => button.tool)).to.be.equal([tap0, tap1, hover0, hover1, hover2])
    })
  })

  describe("should support customization with CSS variables", () => {
    const pixel_styles = `
      :host {
        --bokeh-tool-button-width: 40px;
        --bokeh-tool-button-height: 45px;
        --bokeh-toolbar-divider-color: red;
      }
    `

    const small_button_styles = `
      :host {
        --bokeh-tool-button-width: 10px;
        --bokeh-tool-button-height: 10px;
      }
    `

    const rem_styles = `
      :host {
        --bokeh-tool-button-width: 2rem;
        --bokeh-tool-button-height: 3rem;
      }
    `

    const button_width = 40
    const button_height = 45

    function plot(location: Location, styles: string) {
      const p = fig([200, 200], {
        tools: "pan,box_zoom,reset",
        toolbar_location: location,
        stylesheets: [styles],
      })
      p.scatter([0, 1], [1, 0])
      return p
    }

    function logo_size(toolbar_view: ToolbarView): Size {
      const logo = toolbar_view.shadow_el.querySelector(`.${logo_css.logo}`)
      expect_not_null(logo)
      const rect = logo.getBoundingClientRect()
      const style = getComputedStyle(logo)
      return {
        width: rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight),
        height: rect.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom),
      }
    }

    function expected_size(location: Location, button: Size, logo: Size | null, count: number): Size {
      const horizontal = location == "above" || location == "below"
      const length = horizontal ? button.width : button.height
      const thickness = horizontal ? button.height : button.width
      const logo_length = logo == null ? 0 : horizontal ? logo.width : logo.height
      const logo_thickness = logo == null ? 0 : horizontal ? logo.height : logo.width
      return {
        width: count*length + logo_length + 15,
        height: Math.max(thickness, logo_thickness),
      }
    }

    for (const location of ["above", "right"] as Location[]) {
      it(`should keep toolbar sizes finite after detach with toolbar_location=${location}`, async () => {
        const p = plot(location, pixel_styles)
        const {view} = await display(p)
        const panel = view.toolbar_panel
        expect_not_null(panel)
        const toolbar_view = view.owner.get_one(p.toolbar)
        const logo = toolbar_view.shadow_el.querySelector(`.${logo_css.logo}`)
        expect_not_null(logo)
        const parent = toolbar_view.el.parentNode
        expect_not_null(parent)
        const next_sibling = toolbar_view.el.nextSibling

        toolbar_view.el.remove()
        try {
          expect(logo.isConnected).to.be.false
          const {width, height} = panel.get_size()
          expect(Number.isFinite(width)).to.be.true
          expect(Number.isFinite(height)).to.be.true
        } finally {
          parent.insertBefore(toolbar_view.el, next_sibling)
        }

        expect(logo.isConnected).to.be.true
      })

      it(`should allow to customize tool button width and height with toolbar_location=${location}`, async () => {
        const p = plot(location, pixel_styles)
        const {view} = await display(p)
        const toolbar_view = view.owner.get_one(p.toolbar)
        const tool_button_view = toolbar_view.tool_button_views[0]

        const {width, height} = tool_button_view.el.getBoundingClientRect()
        expect(width).to.be.equal(button_width)
        expect(height).to.be.equal(button_height)
      })

      it(`should account for customizable tool button size in toolbar panel's size with toolbar_location=${location}`, async () => {
        const p = plot(location, pixel_styles)
        const {view} = await display(p)
        const panel = view.toolbar_panel
        expect_not_null(panel)
        const toolbar_view = view.owner.get_one(p.toolbar)
        const button = {width: button_width, height: button_height}
        const expected = expected_size(location, button, logo_size(toolbar_view), p.toolbar.tools.length)
        expect(panel.get_size()).to.be.equal(expected)
      })

      it(`should resolve non-pixel units when sizing the toolbar panel with toolbar_location=${location}`, async () => {
        const p = plot(location, rem_styles)
        const {view} = await display(p)
        const panel = view.toolbar_panel
        expect_not_null(panel)
        const toolbar_view = view.owner.get_one(p.toolbar)
        const root_font_size = parseFloat(getComputedStyle(document.documentElement).fontSize)
        const button = {width: 2*root_font_size, height: 3*root_font_size}
        const expected = expected_size(location, button, logo_size(toolbar_view), p.toolbar.tools.length)
        expect(panel.get_size()).to.be.equal(expected)
      })

      it(`should allow to customize toolbar divider color with toolbar_location=${location}`, async () => {
        const p = plot(location, pixel_styles)
        const {view} = await display(p)
        const toolbar_view = view.owner.get_one(p.toolbar)
        const divider_el = toolbar_view.shadow_el.querySelector(`.${toolbar_css.divider}`)
        expect_not_null(divider_el)
        expect(getComputedStyle(divider_el).backgroundColor).to.be.equal("rgb(255, 0, 0)")
      })
    }

    it("should size the panel to contain the logo when it is larger than the buttons", async () => {
      const p = plot("above", small_button_styles)
      const {view} = await display(p)
      const panel = view.toolbar_panel
      expect_not_null(panel)
      const toolbar_view = view.owner.get_one(p.toolbar)
      const logo = logo_size(toolbar_view)

      expect(panel.get_size()).to.be.equal({
        width: p.toolbar.tools.length*10 + logo.width + 15,
        height: logo.height,
      })
    })

    it("should size the panel from a rendered button when the first tool is hidden", async () => {
      const p = plot("right", rem_styles)
      p.toolbar.tools[0].visible = false
      const {view} = await display(p)
      const toolbar_view = view.owner.get_one(p.toolbar)
      expect(toolbar_view.tool_button_views[0].el.checkVisibility()).to.be.false
      const button_view = toolbar_view.tool_button_views.find((view) => view.el.checkVisibility())
      expect_not_null(button_view)
      const {width} = button_view.el.getBoundingClientRect()

      const panel = view.toolbar_panel
      expect_not_null(panel)
      expect(panel.layout.bbox.width).to.be.above(width - 0.01)
    })

    it("should resolve CSS lengths when every tool is hidden", async () => {
      const p = plot("right", rem_styles)
      for (const tool of p.toolbar.tools) {
        tool.visible = false
      }
      const {view} = await display(p)
      const root_font_size = parseFloat(getComputedStyle(document.documentElement).fontSize)

      const panel = view.toolbar_panel
      expect_not_null(panel)
      expect(panel.layout.bbox.width).to.be.above(2*root_font_size - 0.01)
    })
  })
})

class MultiTool extends SelectTool {
  override tool_name = "Multi Tool"
  override event_type = ["tap" as "tap", "pan" as "pan"]
  override default_order = 10
}

describe("Toolbar Multi Gesture Tool", () => {

  describe("_init_tools method", () => {
    let multi: MultiTool
    let pan: PanTool
    let tap: TapTool

    before_each(() => {
      multi = MultiTool.create()
      pan = PanTool.create()
      tap = TapTool.create()
    })

    it("should have multi inactive after initialization", () => {
      Toolbar.create({tools: [multi, tap, pan]})
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
      expect(tap.active).to.be.true
    })

    it("should have multi active if active_tap", () => {
      Toolbar.create({tools: [multi, tap, pan], active_tap: multi})
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      expect(tap.active).to.be.false
    })

    it("should have gestures inactive after toggling multi active", () => {
      Toolbar.create({tools: [multi, tap, pan]})
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
      expect(tap.active).to.be.true
      multi.active = true
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      expect(tap.active).to.be.false
    })

    it("should have multi inactive after toggling tap active", () => {
      Toolbar.create({tools: [multi, tap], active_tap: multi})
      expect(multi.active).to.be.true
      expect(tap.active).to.be.false
      tap.active = true
      expect(multi.active).to.be.false
      expect(tap.active).to.be.true
    })

    it("should have multi inactive after toggling pan active", () => {
      Toolbar.create({tools: [multi, pan], active_drag: multi})
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      pan.active = true
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
    })
  })
})

describe("ToolbarView's overflow menu", () => {
  const locations: Location[] = ["above", "below", "left", "right"]

  for (const location of locations) {
    const horizontal = location == "above" || location == "below"

    it(`should be perpendicular to a toolbar located ${location} by default`, async () => {
      const toolbar = Toolbar.create({location})
      const {view} = await display(toolbar, [300, 300])
      expect(view.overflow_menu.orientation).to.be.equal(horizontal ? "vertical" : "horizontal")
    })

    it(`should support overflow_orientation='parallel' for a toolbar located ${location}`, async () => {
      const toolbar = Toolbar.create({location, overflow_orientation: "parallel"})
      const {view} = await display(toolbar, [300, 300])
      expect(view.overflow_menu.orientation).to.be.equal(horizontal ? "horizontal" : "vertical")
    })
  }

  it("should close after activating a tool button", async () => {
    const p = fig([200, 200], {tools: "pan,box_zoom,undo,redo,reset,crosshair,examine", toolbar_location: "above"})
    p.scatter([0, 5, 10], [0, 5, 10])
    const {view} = await display(p)

    const toolbar_view = view.owner.get_one(p.toolbar)
    const examine = p.toolbar.tools.find((tool) => tool instanceof ExamineTool)
    expect_not_null(examine)
    const button_view = toolbar_view.tool_button_menu_views.find((view) => view.model.tool == examine)
    expect_not_null(button_view)

    toolbar_view.toggle_menu()
    expect(toolbar_view.overflow_menu.is_open).to.be.true
    expect(button_view.el.isConnected).to.be.true

    await tap(button_view.el)
    await view.ready

    expect(examine.active).to.be.true
    expect(toolbar_view.overflow_menu.is_open).to.be.false
  })

  it("should support ARIA roles and attributes", async () => {
    const p = fig([200, 200], {tools: "pan,box_zoom,undo,redo,reset,crosshair,examine", toolbar_location: "above"})
    p.scatter([0, 5, 10], [0, 5, 10])
    const {view} = await display(p)

    const toolbar_view = view.owner.get_one(p.toolbar)
    const {overflow_el} = toolbar_view
    expect(overflow_el.getAttribute("role")).to.be.equal("button")
    expect(overflow_el.getAttribute("aria-haspopup")).to.be.equal("menu")
    expect(overflow_el.getAttribute("aria-expanded")).to.be.equal("false")

    toolbar_view.toggle_menu()
    await view.ready

    const {overflow_menu} = toolbar_view
    expect(overflow_menu.is_open).to.be.true
    expect(overflow_el.getAttribute("aria-expanded")).to.be.equal("true")
    expect(overflow_menu.el.getAttribute("role")).to.be.equal("menu")
    expect(overflow_menu.el.getAttribute("aria-orientation")).to.be.equal("vertical")
    const controls = overflow_el.getAttribute("aria-controls")
    expect_not_null(controls)
    expect((overflow_el.getRootNode() as ShadowRoot).getElementById(controls)).to.be.equal(overflow_menu.el)

    const menu_view = (tool: unknown) => toolbar_view.tool_button_menu_views.find((view) => view.model.tool == tool)
    const bar_view = (tool: unknown) => toolbar_view.tool_button_views.find((view) => view.model.tool == tool)

    const examine = p.toolbar.tools.find((tool) => tool instanceof ExamineTool)
    expect_not_null(examine)
    const examine_view = menu_view(examine)
    expect_not_null(examine_view)
    expect(examine_view.el.getAttribute("role")).to.be.equal("menuitemcheckbox")
    expect(examine_view.el.getAttribute("aria-checked")).to.be.equal("false")
    expect(examine_view.el.getAttribute("aria-label")).to.be.equal("Examine")

    examine.active = true
    await view.ready
    expect(examine_view.el.getAttribute("aria-checked")).to.be.equal("true")

    const undo = p.toolbar.tools.find((tool) => tool instanceof UndoTool)
    const undo_view = menu_view(undo)
    expect_not_null(undo_view)
    expect(undo_view.el.getAttribute("role")).to.be.equal("menuitem")
    expect(undo_view.el.hasAttribute("aria-checked")).to.be.false

    // Buttons in the bar aren't menu items.
    const examine_bar_view = bar_view(examine)
    expect_not_null(examine_bar_view)
    expect(examine_bar_view.el.hasAttribute("role")).to.be.false

    toolbar_view.toggle_menu()
    await view.ready
    expect(overflow_menu.is_open).to.be.false
    expect(overflow_el.getAttribute("aria-expanded")).to.be.equal("false")
  })

  it("should update orientation when overflow_orientation changes", async () => {
    const toolbar = Toolbar.create({location: "above"})
    const {view} = await display(toolbar, [300, 300])
    expect(view.overflow_menu.orientation).to.be.equal("vertical")

    toolbar.overflow_orientation = "parallel"
    await view.ready
    expect(view.overflow_menu.orientation).to.be.equal("horizontal")
  })

  it("should update orientation when location changes", async () => {
    const toolbar = Toolbar.create({location: "above"})
    const {view} = await display(toolbar, [300, 300])
    expect(view.overflow_menu.orientation).to.be.equal("vertical")

    toolbar.location = "left"
    await view.ready
    expect(view.overflow_menu.orientation).to.be.equal("horizontal")
  })
})

describe("ToolbarView's vDOM component", () => {
  it("should follow toolbar's location and inner attributes", async () => {
    const toolbar = Toolbar.create({tools: [PanTool.create()], location: "above"})
    const {view} = await display(toolbar, [300, 300])
    expect(view.el.classList.contains(toolbar_css.above)).to.be.true
    expect(view.el.classList.contains(toolbar_css.inner)).to.be.false

    toolbar.location = "left"
    toolbar.inner = true
    await view.ready
    expect(view.el.classList.contains(toolbar_css.above)).to.be.false
    expect(view.el.classList.contains(toolbar_css.left)).to.be.true
    expect(view.el.classList.contains(toolbar_css.inner)).to.be.true
  })

  it("should update dividers when tools' visibility changes", async () => {
    const pan = PanTool.create()
    const tap = TapTool.create()
    const toolbar = Toolbar.create({tools: [pan, tap], location: "above"})
    const {view} = await display(toolbar, [300, 300])
    const dividers = () => view.shadow_el.querySelectorAll(`.${toolbar_css.bar} .${toolbar_css.divider}`).length
    expect(dividers()).to.be.equal(1)

    tap.visible = false
    await view.ready
    expect(dividers()).to.be.equal(0)

    tap.visible = true
    await view.ready
    expect(dividers()).to.be.equal(1)
  })

  it("should keep items of the open overflow menu when re-rendering", async () => {
    const p = fig([200, 200], {tools: "pan,box_zoom,undo,redo,reset,crosshair,examine", toolbar_location: "above"})
    p.scatter([0, 5, 10], [0, 5, 10])
    const {view} = await display(p)

    const toolbar_view = view.owner.get_one(p.toolbar)
    const examine = p.toolbar.tools.find((tool) => tool instanceof ExamineTool)
    expect_not_null(examine)
    const button_view = toolbar_view.tool_button_menu_views.find((view) => view.model.tool == examine)
    expect_not_null(button_view)

    toolbar_view.toggle_menu()
    const {overflow_menu} = toolbar_view
    expect(overflow_menu.is_open).to.be.true
    expect(button_view.el.getRootNode()).to.be.equal(overflow_menu.shadow_el)

    p.toolbar.inner = true
    await view.ready

    expect(overflow_menu.is_open).to.be.true
    expect(button_view.el.getRootNode()).to.be.equal(overflow_menu.shadow_el)
  })
})

describe("ToolButtonView", () => {
  async function button(tool: PanTool | ToolGroup<PanTool>) {
    const toolbar = Toolbar.create({tools: [tool], location: "above"})
    const {view} = await display(toolbar, [300, 300])
    const [button_view] = view.tool_button_views
    expect_not_null(button_view)
    return {toolbar, button_view}
  }

  function icon_el(button_view: {shadow_el: ShadowRoot}): HTMLElement {
    const el = button_view.shadow_el.querySelector<HTMLElement>(`.${tb_css.tool_icon}`)
    expect_not_null(el)
    return el
  }

  it("should reflect tool's active state", async () => {
    const pan = PanTool.create()
    const {button_view} = await button(pan)
    expect(pan.active).to.be.true // activated by the toolbar
    expect(button_view.el.classList.contains(tb_css.active)).to.be.true

    pan.active = false
    await button_view.ready
    expect(button_view.el.classList.contains(tb_css.active)).to.be.false

    pan.active = true
    await button_view.ready
    expect(button_view.el.classList.contains(tb_css.active)).to.be.true
  })

  it("should reflect tool's disabled and visible states", async () => {
    const pan = PanTool.create()
    const {button_view} = await button(pan)
    expect(button_view.el.classList.contains(tb_css.disabled)).to.be.false
    expect(button_view.el.classList.contains(tb_css.hidden)).to.be.false

    pan.disabled = true
    pan.visible = false
    await button_view.ready
    expect(button_view.el.classList.contains(tb_css.disabled)).to.be.true
    expect(button_view.el.classList.contains(tb_css.hidden)).to.be.true
  })

  it("should update tooltip when tool's description changes", async () => {
    const pan = PanTool.create()
    const {button_view} = await button(pan)
    expect(button_view.el.title).to.be.equal(pan.tooltip)

    pan.description = "Custom pan"
    await button_view.ready
    expect(button_view.el.title).to.be.equal("Custom pan")

    button_view.model.tooltip = "Button tooltip"
    await button_view.ready
    expect(button_view.el.title).to.be.equal("Button tooltip")
  })

  it("should update icon when tool's icon changes", async () => {
    const pan = PanTool.create()
    const {button_view} = await button(pan)
    expect(icon_el(button_view).classList.contains("bk-tool-icon-pan")).to.be.true

    pan.icon = "zoom_in"
    await button_view.ready
    expect(icon_el(button_view).classList.contains("bk-tool-icon-zoom-in")).to.be.true
    expect(icon_el(button_view).classList.contains("bk-tool-icon-pan")).to.be.false

    pan.icon = "--my-icon"
    await button_view.ready
    expect(icon_el(button_view).style.maskImage).to.be.equal("var(--my-icon)")
  })

  it("should show count of grouped tools", async () => {
    const group = ToolGroup.create({tools: [PanTool.create(), PanTool.create()], show_count: true})
    const {button_view} = await button(group)
    const count_el = button_view.shadow_el.querySelector(`.${tb_css.count}`)
    expect_not_null(count_el)
    expect(count_el.textContent).to.be.equal("2")

    group.tools = [...group.tools, PanTool.create()]
    await button_view.ready
    expect(button_view.shadow_el.querySelector(`.${tb_css.count}`)?.textContent).to.be.equal("3")
  })

  it("should allow the toolbar to re-measure after a tool becomes visible", async () => {
    const pan = PanTool.create()
    const tap = TapTool.create({visible: false})
    const hover = HoverTool.create()
    const p = fig([200, 200], {tools: [pan, tap, hover], toolbar_location: "above"})
    p.scatter([1, 2, 3], [1, 2, 3])
    const {view} = await display(p)
    const toolbar_view = view.owner.get_one(p.toolbar)

    tap.visible = true
    await view.ready

    const lefts = toolbar_view.tool_button_views.map((button_view) => {
      expect(button_view.is_displayed).to.be.true
      return button_view.bbox.left
    })
    const [pan_left, tap_left, hover_left] = lefts
    expect(tap_left).to.be.above(pan_left + 29)
    expect(hover_left).to.be.above(tap_left + 29)
  })

  it("should follow toolbar's location", async () => {
    const pan = PanTool.create()
    const {toolbar, button_view} = await button(pan)
    expect(button_view.el.classList.contains(tb_css.above)).to.be.true

    toolbar.location = "left"
    await button_view.ready
    expect(button_view.el.classList.contains(tb_css.left)).to.be.true
    expect(button_view.el.classList.contains(tb_css.above)).to.be.false
  })
})
