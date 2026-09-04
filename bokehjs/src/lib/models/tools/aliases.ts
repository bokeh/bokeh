import {ClickPanTool} from "./actions/click_pan_tool"
import {CopyTool} from "./actions/copy_tool"
import {ExamineTool} from "./actions/examine_tool"
import {FullscreenTool} from "./actions/fullscreen_tool"
import {HelpTool} from "./actions/help_tool"
import {RedoTool} from "./actions/redo_tool"
import {ResetTool} from "./actions/reset_tool"
import {SaveTool} from "./actions/save_tool"
import {UndoTool} from "./actions/undo_tool"
import {ZoomInTool} from "./actions/zoom_in_tool"
import {ZoomOutTool} from "./actions/zoom_out_tool"
import {FreehandDrawTool} from "./edit/freehand_draw_tool"
import {BoxSelectTool} from "./gestures/box_select_tool"
import {BoxZoomTool} from "./gestures/box_zoom_tool"
import {LassoSelectTool} from "./gestures/lasso_select_tool"
import {PanTool} from "./gestures/pan_tool"
import {PolySelectTool} from "./gestures/poly_select_tool"
import {TapTool} from "./gestures/tap_tool"
import {WheelPanTool} from "./gestures/wheel_pan_tool"
import {WheelZoomTool} from "./gestures/wheel_zoom_tool"
import {CrosshairTool} from "./inspectors/crosshair_tool"
import {HoverTool} from "./inspectors/hover_tool"
import {Tool} from "./tool"

// Tool aliases are installed by class static blocks. Keep those classes as an
// explicit runtime dependency when a tree-shaken npm consumer uses string names.
const tool_classes = [
  ClickPanTool, CopyTool, ExamineTool, FullscreenTool, HelpTool, RedoTool,
  ResetTool, SaveTool, UndoTool, ZoomInTool, ZoomOutTool, FreehandDrawTool,
  BoxSelectTool, BoxZoomTool, LassoSelectTool, PanTool, PolySelectTool, TapTool,
  WheelPanTool, WheelZoomTool, CrosshairTool, HoverTool,
]

let checked = false

export function ensure_tool_aliases(): void {
  if (!checked) {
    for (const tool of tool_classes) {
      if (!(tool.prototype instanceof Tool)) {
        throw new Error(`${tool.name} is not a Tool subclass`)
      }
    }
    checked = true
  }
}
