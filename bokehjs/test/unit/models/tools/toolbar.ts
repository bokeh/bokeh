import {expect} from "assertions"
import {fig, display} from "../../_util"
import {mouse_enter, mouse_leave} from "../../../interactive"

import {Toolbar} from "@bokehjs/models/tools/toolbar"
import {HoverTool} from "@bokehjs/models/tools/inspectors/hover_tool"
import {SelectTool} from "@bokehjs/models/tools/gestures/select_tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {TapTool} from "@bokehjs/models/tools/gestures/tap_tool"
import {build_view} from "@bokehjs/core/build_views"
import {gridplot} from "@bokehjs/api/gridplot"
import {ExamineTool, Plot, CustomAction, Legend, LegendItem, CustomJS, Range1d} from "@bokehjs/models"

describe("Toolbar", () => {

  describe("_active_change method", () => {
    let pan_1: PanTool
    let pan_2: PanTool
    let toolbar: Toolbar

    before_each(() => {
      // by default these tools are inactive
      pan_1 = new PanTool()
      pan_2 = new PanTool()
      toolbar = new Toolbar()
      toolbar.gestures.pan.tools = [new PanTool(), new PanTool()]
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
      hover_1 = new HoverTool()
      hover_2 = new HoverTool()
      hover_3 = new HoverTool()
    })

    it("should set inspect tools as array on Toolbar.inspector property", () => {
      const toolbar = new Toolbar({tools: [hover_1, hover_2, hover_3]})
      expect(toolbar.inspectors).to.be.equal([hover_1, hover_2, hover_3])
    })

    it("should have all inspect tools active when active_inspect='auto'", () => {
      new Toolbar({tools: [hover_1, hover_2, hover_3], active_inspect: "auto"})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.true
      expect(hover_3.active).to.be.true
    })

    it("should have arg inspect tool active when active_inspect=tool instance", () => {
      new Toolbar({tools: [hover_1, hover_2, hover_3], active_inspect: hover_1})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.false
      expect(hover_3.active).to.be.false
    })

    it("should have args inspect tools active when active_inspect=Array(tools)", () => {
      new Toolbar({tools: [hover_1, hover_2, hover_3], active_inspect: [hover_1, hover_2]})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.true
      expect(hover_3.active).to.be.false
    })

    it("should have none inspect tools active when active_inspect=null)", () => {
      new Toolbar({tools: [hover_1, hover_2, hover_3], active_inspect: null})
      expect(hover_1.active).to.be.false
      expect(hover_2.active).to.be.false
      expect(hover_3.active).to.be.false
    })
  })
})

describe("ToolbarView", () => {

  describe("visible getter", () => {
    it("should be true if autohide is false and _visible isn't set", async () => {
      const tb = new Toolbar()
      const tbv = await build_view(tb, {parent: null})
      expect(tbv.model.autohide).to.be.false
      expect(tbv.visible).to.be.true
    })

    it("should be true if autohide is false and _visible is true", async () => {
      const tb = new Toolbar()
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(true)
      expect(tbv.model.autohide).to.be.false
      expect(tbv.visible).to.be.true
    })

    it("should be true if autohide is false and _visible is false", async () => {
      const tb = new Toolbar()
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(false)
      expect(tbv.model.autohide).to.be.false
      expect(tbv.visible).to.be.true
    })

    it("should be false if autohide is true and _visible isn't set", async () => {
      const tb = new Toolbar({autohide: true})
      const tbv = await build_view(tb, {parent: null})
      expect(tbv.model.autohide).to.be.true
      expect(tbv.visible).to.be.false
    })

    it("should be true if autohide is true and _visible is true", async () => {
      const tb = new Toolbar({autohide: true})
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(true)
      expect(tbv.model.autohide).to.be.true
      expect(tbv.visible).to.be.true
    })

    it("should be false if autohide is true and _visible is false", async () => {
      const tb = new Toolbar({autohide: true})
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(false)
      expect(tbv.model.autohide).to.be.true
      expect(tbv.visible).to.be.false
    })
  })

  describe("should allow activation and deactivation", () => {
    it("of ExamineTool", async () => {
      const tool = new ExamineTool()
      const toolbar = new Toolbar({tools: [tool]})
      const plot = new Plot({toolbar})
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
        const legend = new Legend({
          visible: initial,
          items: [
            new LegendItem({label: "Label"}),
          ],
        })
        const tool = new CustomAction({
          icon: ".bk-tool-icon-list",
          active: initial,
        })
        fn(legend, tool)
        const toolbar = new Toolbar({tools: [tool]})
        const plot = new Plot({
          toolbar,
          center: [legend],
          width: 200,
          height: 100,
          x_range: new Range1d({start: 0, end: 1}),
          y_range: new Range1d({start: 0, end: 1}),
        })
        const {view} = await display(plot)
        const toolbar_view = view.owner.get_one(toolbar)
        const tool_button_view = toolbar_view.tool_button_views[0]
        expect(tool_button_view.model.tool.active).to.be.equal(initial)
        expect(legend.visible).to.be.equal(initial)
        /**
          Alternatively `await tap(tool_button_view.el)`, but it's slow
          and unreliable (sometimes doesn't trigger, maybe due to page
          scrolling or something like that).
         */
        tool_button_view.tap()
        await view.ready
        expect(tool_button_view.model.tool.active).to.be.equal(!initial)
        expect(legend.visible).to.be.equal(!initial)
        tool_button_view.tap()
        await view.ready
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
          tool.callback = new CustomJS({
            args: {legend},
            code: `
            export default ({legend}) => {
              legend.visible = !legend.visible
            }
            `,
          })
          tool.active_callback = new CustomJS({
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

  describe("toggleable attribute with inspect tools", () => {
    it("should not show inspect tools if toggleable=false", async () => {
      const hover = new HoverTool({toggleable: false})
      const tb = new Toolbar({tools: [hover]})
      const tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.length).to.be.equal(0)
    })

    it("should show inspect tools if toggleable=true", async () => {
      const hover = new HoverTool({toggleable: true})
      const tb = new Toolbar({tools: [hover]})
      const tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.length).to.be.equal(1)
    })

    it("should show inspect tools if toggleable is not set", async () => {
      const hover = new HoverTool()
      const tb = new Toolbar({tools: [hover]})
      const tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.length).to.be.equal(1)
    })
  })

  describe("visible attribute of tools in toolbar", () => {

    it("should have correct visibility status of tools", () => {
      const hover = new HoverTool()
      const pan = new PanTool()
      const tap = new TapTool()

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
      const hover = new HoverTool({visible: false})
      const pan = new PanTool({visible: false})
      const tap = new TapTool()

      const tb = new Toolbar({tools: [hover, pan, tap]})
      const tb_visible_true = new Toolbar({tools: [tap]})
      const tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.length).to.be.equal(1)
      expect(tbv.tool_buttons[0].tool.tool_name).to.be.equal("Tap")

      const tool_names = tbv.tool_buttons.map((button) => button.tool.tool_name)
      const tb_names = tb_visible_true.tools.map((tool) => tool.tool_name)
      expect(tool_names).to.be.equal(tb_names)
    })

    it("should have default tools all be visible", async () => {
      const hover = new HoverTool()
      const pan = new PanTool()
      const tap = new TapTool()

      const tb = new Toolbar({tools: [hover, pan, tap]})
      const tbv = await build_view(tb, {parent: null})
      expect(tbv.tool_buttons.length).to.be.equal(3)
    })

    it("should show no tools if all tools have visible=false", async () => {
      const hover = new HoverTool({visible: false})
      const pan = new PanTool({visible: false})
      const tap = new TapTool({visible: false})
      const tb = new Toolbar({tools: [hover, pan, tap]})
      const tbv = await build_view(tb, {parent: null})
      expect(tbv.tool_buttons.length).to.be.equal(0)
    })

    it("should properly show tools after changing visibility", async () => {
      const hover = new HoverTool()

      const tb = new Toolbar({tools: [hover]})
      let tbv = await build_view(tb, {parent: null})

      expect(tbv.tool_buttons.length).to.be.equal(1)

      hover.visible = false
      tbv = await build_view(tb, {parent: null})
      expect(tbv.tool_buttons.length).to.be.equal(0)

      hover.visible = true
      tbv = await build_view(tb, {parent: null})
      expect(tbv.tool_buttons.length).to.be.equal(1)
      expect(tbv.tool_buttons[0].tool.tool_name).to.be.equal("Hover")
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
      multi = new MultiTool()
      pan = new PanTool()
      tap = new TapTool()
    })

    it("should have multi inactive after initialization", () => {
      new Toolbar({tools: [multi, tap, pan]})
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
      expect(tap.active).to.be.true
    })

    it("should have multi active if active_tap", () => {
      new Toolbar({tools: [multi, tap, pan], active_tap: multi})
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      expect(tap.active).to.be.false
    })

    it("should have gestures inactive after toggling multi active", () => {
      new Toolbar({tools: [multi, tap, pan]})
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
      expect(tap.active).to.be.true
      multi.active = true
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      expect(tap.active).to.be.false
    })

    it("should have multi inactive after toggling tap active", () => {
      new Toolbar({tools: [multi, tap], active_tap: multi})
      expect(multi.active).to.be.true
      expect(tap.active).to.be.false
      tap.active = true
      expect(multi.active).to.be.false
      expect(tap.active).to.be.true
    })

    it("should have multi inactive after toggling pan active", () => {
      new Toolbar({tools: [multi, pan], active_drag: multi})
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      pan.active = true
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
    })
  })
})
