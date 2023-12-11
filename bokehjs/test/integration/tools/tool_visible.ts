import {display, fig} from "../_util"
import {press} from "../../interactive"

import * as all from "@bokehjs/models/tools"
import {Toolbar} from "@bokehjs/models"

describe("Tools", () => {
  const tools = [
    new all.BoxEditTool({visible: false}),
    new all.BoxSelectTool({visible: false}),
    new all.BoxZoomTool({visible: false}),
    new all.CopyTool({visible: false}),
    new all.CrosshairTool({visible: false}),
    new all.CustomAction({visible: false}),
    new all.FreehandDrawTool({visible: false}),
    new all.HelpTool({visible: false}),
    new all.HoverTool({visible: false}),
    new all.LassoSelectTool({visible: false}),
    new all.LineEditTool({visible: false}),
    new all.PanTool({visible: false}),
    new all.PointDrawTool({visible: false}),
    new all.PolyDrawTool({visible: false}),
    new all.PolyEditTool({visible: false}),
    new all.PolySelectTool({visible: false}),
    new all.RangeTool({visible: false}),
    new all.RedoTool({visible: false}),
    new all.ResetTool({visible: false}),
    new all.SaveTool({visible: false}),
    new all.TapTool({visible: false}),
    new all.UndoTool({visible: false}),
    new all.WheelPanTool({visible: false}),
    new all.WheelZoomTool({visible: false}),
    new all.ZoomInTool({visible: false}),
    new all.ZoomOutTool({visible: false}),
  ]

  for (const tool of tools){
    it(`should show ${tool.type}'s visibility works`, async () => {
      if (tool.visible === true) {
        throw new Error(`${tool.type} is unexpectedly visible.`);
      }
      const tool_button = tool.tool_button();
      const toolbar = new Toolbar({ buttons: [tool_button], tools: [tool] })
      const p = fig([300, 100], { toolbar_location: "right", toolbar })

      const {view} = await display(p);
      const tool_button_view = view.owner.get_one(tool_button);
      await press(tool_button_view.el)

    })
  }
})
