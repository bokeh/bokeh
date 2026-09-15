import {display, fig} from "#framework/layouts"
import {press} from "#framework/interactive"

import * as all from "@bokehjs/models/tools"
import {Toolbar} from "@bokehjs/models"

describe("Tools", () => {
  const tools = [
    all.BoxEditTool.create(),
    all.BoxSelectTool.create(),
    all.BoxZoomTool.create(),
    all.CopyTool.create(),
    all.CrosshairTool.create(),
    all.CustomAction.create(),
    all.FreehandDrawTool.create(),
    all.HelpTool.create(),
    all.HoverTool.create(),
    all.LassoSelectTool.create(),
    all.LineEditTool.create(),
    all.PanTool.create(),
    all.PointDrawTool.create(),
    all.PolyDrawTool.create(),
    all.PolyEditTool.create(),
    all.PolySelectTool.create(),
    all.RangeTool.create(),
    all.RedoTool.create(),
    all.ResetTool.create(),
    all.SaveTool.create(),
    all.TapTool.create(),
    all.UndoTool.create(),
    all.WheelPanTool.create(),
    all.WheelZoomTool.create(),
    all.ZoomInTool.create(),
    all.ZoomOutTool.create(),
  ]

  for (const tool of tools) {
    if (tool.menu == null) {
      continue
    }

    it(`should support ${tool.type}'s setup menu`, async () => {
      const tool_button = tool.tool_button()
      const toolbar = Toolbar.create({buttons: [tool_button], tools: [tool]})
      const p = fig([300, 100], {toolbar_location: "right", toolbar})
      p.scatter([1, 2, 3], [1, 2, 3])
      const {view} = await display(p)
      const tool_button_view = view.owner.get_one(tool_button)
      await press(tool_button_view.el)
    })
  }
})
