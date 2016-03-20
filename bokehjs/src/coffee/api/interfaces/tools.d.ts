declare namespace Bokeh {
export interface ToolEvents extends Model {
    geometries: Array<any>;
}

export interface Tool extends Model, BackRef {}

export interface PanTool extends Tool {
    dimensions: Array<Dimension>;
}

export interface WheelZoomTool extends Tool {
    dimensions: Array<Dimension>;
}

export interface PreviewSaveTool extends Tool {}

export interface UndoTool extends Tool {}

export interface RedoTool extends Tool {}

export interface ResetTool extends Tool {}

export interface ResizeTool extends Tool {}

export interface InspectTool {
    active: boolean;
}

export interface CrosshairTool extends Tool, InspectTool {
    dimensions: Array<Dimension>;

    line_color: Color;
    line_width: number;
    line_alpha: number;
}

export interface BoxZoomTool extends Tool {}

export interface TransientSelectTool extends Tool {
    names: Array<string>;
    renderers: Array<Renderer>;
}

export interface SelectTool extends TransientSelectTool {}

export interface BoxSelectTool extends SelectTool {
    select_every_mousemove: boolean;
    dimensions: Array<Dimension>;
}

export interface LassoSelectTool extends SelectTool {
    select_every_mousemove: boolean;
}

export interface PolySelectTool extends SelectTool {}

export interface TapTool extends SelectTool {
    callback: Callback;
}

export interface HoverTool extends TransientSelectTool, InspectTool {
    tooltips: Tooltip;
    callback: Callback;
    mode: HoverMode;
    point_policy: PointPolicy;
    line_policy: LinePolicy;
}

export interface HelpTool extends Tool {
    help_tooltip: string;
    redirect: string;
}
}
