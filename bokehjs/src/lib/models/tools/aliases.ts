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

// String aliases don't retain their tool classes in tree-shaken npm bundles,
// so register every class through this eagerly evaluated side-effect module.
Tool.register_alias("pan_left", () => ClickPanTool.create({direction: "left"}))
Tool.register_alias("pan_right", () => ClickPanTool.create({direction: "right"}))
Tool.register_alias("pan_up", () => ClickPanTool.create({direction: "up"}))
Tool.register_alias("pan_down", () => ClickPanTool.create({direction: "down"}))
Tool.register_alias("pan_west", () => ClickPanTool.create({direction: "west"}))
Tool.register_alias("pan_east", () => ClickPanTool.create({direction: "east"}))
Tool.register_alias("pan_north", () => ClickPanTool.create({direction: "north"}))
Tool.register_alias("pan_south", () => ClickPanTool.create({direction: "south"}))
Tool.register_alias("copy", () => CopyTool.create())
Tool.register_alias("examine", () => ExamineTool.create())
Tool.register_alias("fullscreen", () => FullscreenTool.create())
Tool.register_alias("help", () => HelpTool.create())
Tool.register_alias("redo", () => RedoTool.create())
Tool.register_alias("reset", () => ResetTool.create())
Tool.register_alias("save", () => SaveTool.create())
Tool.register_alias("undo", () => UndoTool.create())
Tool.register_alias("zoom_in", () => ZoomInTool.create({dimensions: "both"}))
Tool.register_alias("xzoom_in", () => ZoomInTool.create({dimensions: "width"}))
Tool.register_alias("yzoom_in", () => ZoomInTool.create({dimensions: "height"}))
Tool.register_alias("zoom_out", () => ZoomOutTool.create({dimensions: "both"}))
Tool.register_alias("xzoom_out", () => ZoomOutTool.create({dimensions: "width"}))
Tool.register_alias("yzoom_out", () => ZoomOutTool.create({dimensions: "height"}))
Tool.register_alias("freehand_draw", () => FreehandDrawTool.create())
Tool.register_alias("box_select", () => BoxSelectTool.create())
Tool.register_alias("xbox_select", () => BoxSelectTool.create({dimensions: "width"}))
Tool.register_alias("ybox_select", () => BoxSelectTool.create({dimensions: "height"}))
Tool.register_alias("box_zoom", () => BoxZoomTool.create({dimensions: "both"}))
Tool.register_alias("xbox_zoom", () => BoxZoomTool.create({dimensions: "width"}))
Tool.register_alias("ybox_zoom", () => BoxZoomTool.create({dimensions: "height"}))
Tool.register_alias("auto_box_zoom", () => BoxZoomTool.create({dimensions: "auto"}))
Tool.register_alias("lasso_select", () => LassoSelectTool.create())
Tool.register_alias("pan", () => PanTool.create({dimensions: "both"}))
Tool.register_alias("xpan", () => PanTool.create({dimensions: "width"}))
Tool.register_alias("ypan", () => PanTool.create({dimensions: "height"}))
Tool.register_alias("poly_select", () => PolySelectTool.create())
Tool.register_alias("click", () => TapTool.create({behavior: "inspect"}))
Tool.register_alias("tap", () => TapTool.create())
Tool.register_alias("doubletap", () => TapTool.create({gesture: "doubletap"}))
Tool.register_alias("xwheel_pan", () => WheelPanTool.create({dimension: "width"}))
Tool.register_alias("ywheel_pan", () => WheelPanTool.create({dimension: "height"}))
Tool.register_alias("wheel_zoom", () => WheelZoomTool.create({dimensions: "both"}))
Tool.register_alias("xwheel_zoom", () => WheelZoomTool.create({dimensions: "width"}))
Tool.register_alias("ywheel_zoom", () => WheelZoomTool.create({dimensions: "height"}))
Tool.register_alias("crosshair", () => CrosshairTool.create())
Tool.register_alias("xcrosshair", () => CrosshairTool.create({dimensions: "width"}))
Tool.register_alias("ycrosshair", () => CrosshairTool.create({dimensions: "height"}))
Tool.register_alias("hover", () => HoverTool.create())
