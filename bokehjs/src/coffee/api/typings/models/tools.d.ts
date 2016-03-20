declare namespace Bokeh {
    export var ToolEvents: { new(): ToolEvents };
    export interface ToolEvents extends Model {
        geometries: Array<any>;
    }

    export interface Tool extends Model, BackRef {}

    export var PanTool: { new(): PanTool };
    export interface PanTool extends Tool {
        dimensions: Array<Dimension>;
    }

    export var WheelZoomTool: { new(): WheelZoomTool };
    export interface WheelZoomTool extends Tool {
        dimensions: Array<Dimension>;
    }

    export var PreviewSaveTool: { new(): PreviewSaveTool };
    export interface PreviewSaveTool extends Tool {}

    export var UndoTool: { new(): UndoTool };
    export interface UndoTool extends Tool {}

    export var RedoTool: { new(): RedoTool };
    export interface RedoTool extends Tool {}

    export var ResetTool: { new(): ResetTool };
    export interface ResetTool extends Tool {}

    export var ResizeTool: { new(): ResizeTool };
    export interface ResizeTool extends Tool {}

    export interface InspectTool {
        active: boolean;
    }

    export var CrosshairTool: { new(): CrosshairTool };
    export interface CrosshairTool extends Tool, InspectTool {
        dimensions: Array<Dimension>;

        line_color: Color;
        line_width: number;
        line_alpha: number;
    }

    export var BoxZoomTool: { new(): BoxZoomTool };
    export interface BoxZoomTool extends Tool {}

    export interface TransientSelectTool extends Tool {
        names: Array<string>;
        renderers: Array<Renderer>;
    }

    export interface SelectTool extends TransientSelectTool {}

    export var BoxSelectTool: { new(): BoxSelectTool };
    export interface BoxSelectTool extends SelectTool {
        select_every_mousemove: boolean;
        dimensions: Array<Dimension>;
    }

    export var LassoSelectTool: { new(): LassoSelectTool };
    export interface LassoSelectTool extends SelectTool {
        select_every_mousemove: boolean;
    }

    export var PolySelectTool: { new(): PolySelectTool };
    export interface PolySelectTool extends SelectTool {}

    export var TapTool: { new(): TapTool };
    export interface TapTool extends SelectTool {
        callback: Callback;
    }

    export var HoverTool: { new(): HoverTool };
    export interface HoverTool extends TransientSelectTool, InspectTool {
        tooltips: Tooltip;
        callback: Callback;
        mode: HoverMode;
        point_policy: PointPolicy;
        line_policy: LinePolicy;
    }

    export var HelpTool: { new(): HelpTool };
    export interface HelpTool extends Tool {
        help_tooltip: string;
        redirect: string;
    }
}
