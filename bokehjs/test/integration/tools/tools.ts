import {display, fig} from "../_util"
import {press} from "../../interactive"

import * as all from "@bokehjs/models/tools"
import {Toolbar} from "@bokehjs/models"

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
    if (tool.menu == null) {
      continue
    }

    it(`should support ${tool.type}'s setup menu`, async () => {
      const tool_button = tool.tool_button()
      const toolbar = new Toolbar({buttons: [tool_button], tools: [tool]})
      const p = fig([300, 100], {toolbar_location: "right", toolbar})
      p.scatter([1, 2, 3], [1, 2, 3])
      const {view} = await display(p)
      const tool_button_view = view.owner.get_one(tool_button)
      await press(tool_button_view.el)
    })
  }
})
