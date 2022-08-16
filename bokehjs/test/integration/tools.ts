import {display, fig} from "./_util"

import * as all from "@bokehjs/models/tools"

import {PlotView} from "@bokehjs/models/plots/plot"
import {ToolbarPanelView} from "@bokehjs/models/annotations/toolbar_panel"

import {assert} from "@bokehjs/core/util/assert"
import {delay} from "@bokehjs/core/util/defer"

function get_button_el(view: PlotView): HTMLElement {
  const tbpv = [...view.renderer_views.values()].find((view): view is ToolbarPanelView => view instanceof ToolbarPanelView)
  assert(tbpv != null)
  const [button_view] = tbpv.toolbar_view.tool_button_views.values()
  return button_view.el
}

async function press(el: HTMLElement): Promise<void> {
  const ev0 = new MouseEvent("mousedown", {clientX: 5, clientY: 5, bubbles: true})
  el.dispatchEvent(ev0)

  await delay(300)

  const ev1 = new MouseEvent("mouseup", {clientX: 5, clientY: 5, bubbles: true})
  el.dispatchEvent(ev1)
}

describe("Tools", () => {
  const tools = [
    new all.BoxEditTool(),
    new all.BoxSelectTool(),
    new all.BoxZoomTool(),
    new all.CopyTool(),
    new all.CrosshairTool(),
    new all.CustomAction(),
    new all.FreehandDrawTool(),
    new all.HelpTool(),
    new all.HoverTool(),
    new all.LassoSelectTool(),
    new all.LineEditTool(),
    new all.PanTool(),
    new all.PointDrawTool(),
    new all.PolyDrawTool(),
    new all.PolyEditTool(),
    new all.PolySelectTool(),
    new all.RangeTool(),
    new all.RedoTool(),
    new all.ResetTool(),
    new all.SaveTool(),
    new all.TapTool(),
    new all.UndoTool(),
    new all.WheelPanTool(),
    new all.WheelZoomTool(),
    new all.ZoomInTool(),
    new all.ZoomOutTool(),
  ]

  for (const tool of tools) {
    if (tool.menu == null)
      continue

    it(`should support ${tool.type}'s setup menu`, async () => {
      const p = fig([200, 100], {toolbar_location: "right", tools: [tool]})
      p.circle([1, 2, 3], [1, 2, 3])
      const {view} = await display(p)
      const el = get_button_el(view)
      await press(el)
    })
  }
})
