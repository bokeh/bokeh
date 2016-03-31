declare namespace Bokeh {
    export var ToolEvents: { new(attributes?: IToolEvents, options?: KeyVal): ToolEvents };
    export interface ToolEvents extends Model, IToolEvents {}
    export interface IToolEvents extends IModel {
        geometries?: Array<any>;
    }

    export interface Tool extends Model, ITool {}
    export interface ITool extends IModel, IBackRef {}

    export interface InspectTool extends Tool, IInspectTool {}
    export interface IInspectTool extends ITool {
        active?: boolean;
    }

    export interface SelectTool extends Tool, ISelectTool {}
    export interface ISelectTool extends ITool, IHitTest {}

    export interface IHitTest {
        names?: Array<string>;
        renderers?: Array<Renderer>;
    }

    export var PanTool: { new(attributes?: IPanTool, options?: KeyVal): PanTool };
    export interface PanTool extends Tool, IPanTool {}
    export interface IPanTool extends ITool {
        dimensions?: Array<Dimension>;
    }

    export var WheelZoomTool: { new(attributes?: IWheelZoomTool, options?: KeyVal): WheelZoomTool };
    export interface WheelZoomTool extends Tool, IWheelZoomTool {}
    export interface IWheelZoomTool extends ITool {
        dimensions?: Array<Dimension>;
    }

    export var PreviewSaveTool: { new(attributes?: IPreviewSaveTool, options?: KeyVal): PreviewSaveTool };
    export interface PreviewSaveTool extends Tool, IPreviewSaveTool {}
    export interface IPreviewSaveTool extends ITool {}

    export var UndoTool: { new(attributes?: IUndoTool, options?: KeyVal): UndoTool };
    export interface UndoTool extends Tool, IUndoTool {}
    export interface IUndoTool extends ITool {}

    export var RedoTool: { new(attributes?: IRedoTool, options?: KeyVal): RedoTool };
    export interface RedoTool extends Tool, IRedoTool {}
    export interface IRedoTool extends ITool {}

    export var ResetTool: { new(attributes?: IResetTool, options?: KeyVal): ResetTool };
    export interface ResetTool extends Tool, IResetTool {}
    export interface IResetTool extends ITool {}

    export var ResizeTool: { new(attributes?: IResizeTool, options?: KeyVal): ResizeTool };
    export interface ResizeTool extends Tool, IResizeTool {}
    export interface IResizeTool extends ITool {}

    export var CrosshairTool: { new(attributes?: ICrosshairTool, options?: KeyVal): CrosshairTool };
    export interface CrosshairTool extends InspectTool, ICrosshairTool {}
    export interface ICrosshairTool extends IInspectTool {
        dimensions?: Array<Dimension>;

        line_color?: Color;
        line_width?: number;
        line_alpha?: number;
    }

    export var BoxZoomTool: { new(attributes?: IBoxZoomTool, options?: KeyVal): BoxZoomTool };
    export interface BoxZoomTool extends Tool, IBoxZoomTool {}
    export interface IBoxZoomTool extends ITool {}

    export var BoxSelectTool: { new(attributes?: IBoxSelectTool, options?: KeyVal): BoxSelectTool };
    export interface BoxSelectTool extends SelectTool, IBoxSelectTool {}
    export interface IBoxSelectTool extends ISelectTool {
        select_every_mousemove?: boolean;
        dimensions?: Array<Dimension>;
    }

    export var LassoSelectTool: { new(attributes?: ILassoSelectTool, options?: KeyVal): LassoSelectTool };
    export interface LassoSelectTool extends SelectTool, ILassoSelectTool {}
    export interface ILassoSelectTool extends ISelectTool {
        select_every_mousemove?: boolean;
    }

    export var PolySelectTool: { new(attributes?: IPolySelectTool, options?: KeyVal): PolySelectTool };
    export interface PolySelectTool extends SelectTool, IPolySelectTool {}
    export interface IPolySelectTool extends ISelectTool {}

    export var TapTool: { new(attributes?: ITapTool, options?: KeyVal): TapTool };
    export interface TapTool extends SelectTool, ITapTool {}
    export interface ITapTool extends ISelectTool {
        callback?: Callback;
    }

    export var HoverTool: { new(attributes?: IHoverTool, options?: KeyVal): HoverTool };
    export interface HoverTool extends InspectTool, IHoverTool {}
    export interface IHoverTool extends IInspectTool, IHitTest {
        tooltips?: Tooltip;
        callback?: Callback;
        mode?: HoverMode;
        point_policy?: PointPolicy;
        line_policy?: LinePolicy;
    }

    export var HelpTool: { new(attributes?: IHelpTool, options?: KeyVal): HelpTool };
    export interface HelpTool extends Tool, IHelpTool {}
    export interface IHelpTool extends ITool {
        help_tooltip?: string;
        redirect?: string;
    }
}
