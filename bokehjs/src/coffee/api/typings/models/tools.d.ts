declare namespace Bokeh {
    export var ToolEvents: { new(attributes?: KeyVal, options?: KeyVal): ToolEvents };
    export interface ToolEvents extends Model {
        geometries: Array<any>;
    }

    export interface Tool extends Model, BackRef {}

    export var PanTool: { new(attributes?: KeyVal, options?: KeyVal): PanTool };
    export interface PanTool extends Tool {
        dimensions: Array<Dimension>;
    }

    export var WheelZoomTool: { new(attributes?: KeyVal, options?: KeyVal): WheelZoomTool };
    export interface WheelZoomTool extends Tool {
        dimensions: Array<Dimension>;
    }

    export var PreviewSaveTool: { new(attributes?: KeyVal, options?: KeyVal): PreviewSaveTool };
    export interface PreviewSaveTool extends Tool {}

    export var UndoTool: { new(attributes?: KeyVal, options?: KeyVal): UndoTool };
    export interface UndoTool extends Tool {}

    export var RedoTool: { new(attributes?: KeyVal, options?: KeyVal): RedoTool };
    export interface RedoTool extends Tool {}

    export var ResetTool: { new(attributes?: KeyVal, options?: KeyVal): ResetTool };
    export interface ResetTool extends Tool {}

    export var ResizeTool: { new(attributes?: KeyVal, options?: KeyVal): ResizeTool };
    export interface ResizeTool extends Tool {}

    export interface InspectTool {
        active: boolean;
    }

    export var CrosshairTool: { new(attributes?: KeyVal, options?: KeyVal): CrosshairTool };
    export interface CrosshairTool extends Tool, InspectTool {
        dimensions: Array<Dimension>;

        line_color: Color;
        line_width: number;
        line_alpha: number;
    }

    export var BoxZoomTool: { new(attributes?: KeyVal, options?: KeyVal): BoxZoomTool };
    export interface BoxZoomTool extends Tool {}

    export interface TransientSelectTool extends Tool {
        names: Array<string>;
        renderers: Array<Renderer>;
    }

    export interface SelectTool extends TransientSelectTool {}

    export var BoxSelectTool: { new(attributes?: KeyVal, options?: KeyVal): BoxSelectTool };
    export interface BoxSelectTool extends SelectTool {
        select_every_mousemove: boolean;
        dimensions: Array<Dimension>;
    }

    export var LassoSelectTool: { new(attributes?: KeyVal, options?: KeyVal): LassoSelectTool };
    export interface LassoSelectTool extends SelectTool {
        select_every_mousemove: boolean;
    }

    export var PolySelectTool: { new(attributes?: KeyVal, options?: KeyVal): PolySelectTool };
    export interface PolySelectTool extends SelectTool {}

    export var TapTool: { new(attributes?: KeyVal, options?: KeyVal): TapTool };
    export interface TapTool extends SelectTool {
        callback: Callback;
    }

    export var HoverTool: { new(attributes?: KeyVal, options?: KeyVal): HoverTool };
    export interface HoverTool extends TransientSelectTool, InspectTool {
        tooltips: Tooltip;
        callback: Callback;
        mode: HoverMode;
        point_policy: PointPolicy;
        line_policy: LinePolicy;
    }

    export var HelpTool: { new(attributes?: KeyVal, options?: KeyVal): HelpTool };
    export interface HelpTool extends Tool {
        help_tooltip: string;
        redirect: string;
    }
}
