declare namespace Bokeh {
  export var ToolEvents: { new(attributes?: IToolEvents, options?: ModelOpts): ToolEvents };
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

  export var PanTool: { new(attributes?: IPanTool, options?: ModelOpts): PanTool };
  export interface PanTool extends Tool, IPanTool {}
  export interface IPanTool extends ITool {
    dimensions?: Dimensions;
  }

  export var WheelPanTool: { new(attributes?: IWheelPanTool, options?: ModelOpts): WheelPanTool };
  export interface WheelPanTool extends Tool, IWheelPanTool {}
  export interface IWheelPanTool extends ITool {
    dimension?: Dimension;
  }

  export var WheelZoomTool: { new(attributes?: IWheelZoomTool, options?: ModelOpts): WheelZoomTool };
  export interface WheelZoomTool extends Tool, IWheelZoomTool {}
  export interface IWheelZoomTool extends ITool {
    dimensions?: Dimensions;
  }

  export var ZoomInTool: { new(attributes?: IZoomInTool, options?: ModelOpts): ZoomInTool };
  export interface ZoomInTool extends Tool, IZoomInTool {}
  export interface IZoomInTool extends ITool {
    factor?: Percent;
    dimensions?: Dimensions;
  }

  export var ZoomOutTool: { new(attributes?: IZoomOutTool, options?: ModelOpts): ZoomOutTool };
  export interface ZoomOutTool extends Tool, IZoomOutTool {}
  export interface IZoomOutTool extends ITool {
    factor?: Percent;
    dimensions?: Dimensions;
  }

  export var SaveTool: { new(attributes?: ISaveTool, options?: ModelOpts): SaveTool };
  export interface SaveTool extends Tool, ISaveTool {}
  export interface ISaveTool extends ITool {}

  export var UndoTool: { new(attributes?: IUndoTool, options?: ModelOpts): UndoTool };
  export interface UndoTool extends Tool, IUndoTool {}
  export interface IUndoTool extends ITool {}

  export var RedoTool: { new(attributes?: IRedoTool, options?: ModelOpts): RedoTool };
  export interface RedoTool extends Tool, IRedoTool {}
  export interface IRedoTool extends ITool {}

  export var ResetTool: { new(attributes?: IResetTool, options?: ModelOpts): ResetTool };
  export interface ResetTool extends Tool, IResetTool {}
  export interface IResetTool extends ITool {
    reset_size?: Boolean;
  }

  export var ResizeTool: { new(attributes?: IResizeTool, options?: ModelOpts): ResizeTool };
  export interface ResizeTool extends Tool, IResizeTool {}
  export interface IResizeTool extends ITool {}

  export var CrosshairTool: { new(attributes?: ICrosshairTool, options?: ModelOpts): CrosshairTool };
  export interface CrosshairTool extends InspectTool, ICrosshairTool {}
  export interface ICrosshairTool extends IInspectTool {
    dimensions?: Dimensions;

    line_color?: Color;
    line_width?: number;
    line_alpha?: number;
  }

  export var BoxZoomTool: { new(attributes?: IBoxZoomTool, options?: ModelOpts): BoxZoomTool };
  export interface BoxZoomTool extends Tool, IBoxZoomTool {}
  export interface IBoxZoomTool extends ITool {}

  export var BoxSelectTool: { new(attributes?: IBoxSelectTool, options?: ModelOpts): BoxSelectTool };
  export interface BoxSelectTool extends SelectTool, IBoxSelectTool {}
  export interface IBoxSelectTool extends ISelectTool {
    select_every_mousemove?: boolean;
    dimensions?: Dimensions;
  }

  export var LassoSelectTool: { new(attributes?: ILassoSelectTool, options?: ModelOpts): LassoSelectTool };
  export interface LassoSelectTool extends SelectTool, ILassoSelectTool {}
  export interface ILassoSelectTool extends ISelectTool {
    select_every_mousemove?: boolean;
  }

  export var PolySelectTool: { new(attributes?: IPolySelectTool, options?: ModelOpts): PolySelectTool };
  export interface PolySelectTool extends SelectTool, IPolySelectTool {}
  export interface IPolySelectTool extends ISelectTool {}

  export var TapTool: { new(attributes?: ITapTool, options?: ModelOpts): TapTool };
  export interface TapTool extends SelectTool, ITapTool {}
  export interface ITapTool extends ISelectTool {
    behavior?: "select" | "inspect";
    callback?: Callback | ((source: DataSource) => void);
  }

  export interface HoverTooltipInfo {
    index:  Int;
    x:      ArrayLike<number>;
    y:      ArrayLike<number>;
    vx:     ArrayLike<number>;
    vy:     ArrayLike<number>;
    sx:     ArrayLike<number>;
    sy:     ArrayLike<number>;
    data_x: ArrayLike<number>;
    data_y: ArrayLike<number>;
    rx:     ArrayLike<number>;
    ry:     ArrayLike<number>;
  }

  export interface HoverCallbackData {
    index: Array<Int> | Array<Array<Int>>;
    geometry: {
      type: "point" | "span";
      direction?: "h" | "v";
      x: ArrayLike<number>;
      y: ArrayLike<number>;
      vx: ArrayLike<number>;
      vy: ArrayLike<number>;
      sx: ArrayLike<number>;
      sy: ArrayLike<number>;
    };
  }

  export var HoverTool: { new(attributes?: IHoverTool, options?: ModelOpts): HoverTool };
  export interface HoverTool extends InspectTool, IHoverTool {}
  export interface IHoverTool extends IInspectTool, IHitTest {
    tooltips?: HTMLElement | Array<[string, string]> | ((source: DataSource, info: HoverTooltipInfo) => HTMLElement);
    callback?: Callback | ((tool: HoverTool, data: HoverCallbackData) => void);
    mode?: HoverMode;
    point_policy?: PointPolicy;
    line_policy?: LinePolicy;
    anchor?: Anchor;
    attachment?: "horizontal" | "vertical";
    show_arrow?: boolean;
  }

  export var HelpTool: { new(attributes?: IHelpTool, options?: ModelOpts): HelpTool };
  export interface HelpTool extends Tool, IHelpTool {}
  export interface IHelpTool extends ITool {
    help_tooltip?: string;
    redirect?: string;
  }
}
