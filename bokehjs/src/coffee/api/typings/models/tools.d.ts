declare namespace Bokeh {
  export interface Tool extends Model, ITool {}
  export interface ITool extends IModel, IBackRef {}

  export interface InspectTool extends Tool, IInspectTool {}
  export interface IInspectTool extends ITool {
    active?: boolean;
  }

  export interface SelectTool extends Tool, ISelectTool {}
  export interface ISelectTool extends ITool, IHitTest {}

  export interface IHitTest {
    names?: string[];
    renderers?: Renderer[];
  }

  export const PanTool: { new(attributes?: IPanTool, options?: ModelOpts): PanTool };
  export interface PanTool extends Tool, IPanTool {}
  export interface IPanTool extends ITool {
    dimensions?: Dimensions;
  }

  export const WheelPanTool: { new(attributes?: IWheelPanTool, options?: ModelOpts): WheelPanTool };
  export interface WheelPanTool extends Tool, IWheelPanTool {}
  export interface IWheelPanTool extends ITool {
    dimension?: Dimension;
  }

  export const WheelZoomTool: { new(attributes?: IWheelZoomTool, options?: ModelOpts): WheelZoomTool };
  export interface WheelZoomTool extends Tool, IWheelZoomTool {}
  export interface IWheelZoomTool extends ITool {
    dimensions?: Dimensions;
  }

  export const ZoomInTool: { new(attributes?: IZoomInTool, options?: ModelOpts): ZoomInTool };
  export interface ZoomInTool extends Tool, IZoomInTool {}
  export interface IZoomInTool extends ITool {
    factor?: Percent;
    dimensions?: Dimensions;
  }

  export const ZoomOutTool: { new(attributes?: IZoomOutTool, options?: ModelOpts): ZoomOutTool };
  export interface ZoomOutTool extends Tool, IZoomOutTool {}
  export interface IZoomOutTool extends ITool {
    factor?: Percent;
    dimensions?: Dimensions;
  }

  export const SaveTool: { new(attributes?: ISaveTool, options?: ModelOpts): SaveTool };
  export interface SaveTool extends Tool, ISaveTool {}
  export interface ISaveTool extends ITool {}

  export const UndoTool: { new(attributes?: IUndoTool, options?: ModelOpts): UndoTool };
  export interface UndoTool extends Tool, IUndoTool {}
  export interface IUndoTool extends ITool {}

  export const RedoTool: { new(attributes?: IRedoTool, options?: ModelOpts): RedoTool };
  export interface RedoTool extends Tool, IRedoTool {}
  export interface IRedoTool extends ITool {}

  export const ResetTool: { new(attributes?: IResetTool, options?: ModelOpts): ResetTool };
  export interface ResetTool extends Tool, IResetTool {}
  export interface IResetTool extends ITool {

  }

  export const CrosshairTool: { new(attributes?: ICrosshairTool, options?: ModelOpts): CrosshairTool };
  export interface CrosshairTool extends InspectTool, ICrosshairTool {}
  export interface ICrosshairTool extends IInspectTool {
    dimensions?: Dimensions;

    line_color?: Color;
    line_width?: number;
    line_alpha?: number;
  }

  export const BoxZoomTool: { new(attributes?: IBoxZoomTool, options?: ModelOpts): BoxZoomTool };
  export interface BoxZoomTool extends Tool, IBoxZoomTool {}
  export interface IBoxZoomTool extends ITool {}

  export const BoxSelectTool: { new(attributes?: IBoxSelectTool, options?: ModelOpts): BoxSelectTool };
  export interface BoxSelectTool extends SelectTool, IBoxSelectTool {}
  export interface IBoxSelectTool extends ISelectTool {
    select_every_mousemove?: boolean;
    dimensions?: Dimensions;
  }

  export const LassoSelectTool: { new(attributes?: ILassoSelectTool, options?: ModelOpts): LassoSelectTool };
  export interface LassoSelectTool extends SelectTool, ILassoSelectTool {}
  export interface ILassoSelectTool extends ISelectTool {
    select_every_mousemove?: boolean;
  }

  export const PolySelectTool: { new(attributes?: IPolySelectTool, options?: ModelOpts): PolySelectTool };
  export interface PolySelectTool extends SelectTool, IPolySelectTool {}
  export interface IPolySelectTool extends ISelectTool {}

  export const TapTool: { new(attributes?: ITapTool, options?: ModelOpts): TapTool };
  export interface TapTool extends SelectTool, ITapTool {}
  export interface ITapTool extends ISelectTool {
    behavior?: "select" | "inspect";
    callback?: Callback | ((source: DataSource) => void);
  }

  export interface HoverTooltipInfo {
    index:  Int;
    x:      ArrayLike<number>;
    y:      ArrayLike<number>;
    sx:     ArrayLike<number>;
    sy:     ArrayLike<number>;
    data_x: ArrayLike<number>;
    data_y: ArrayLike<number>;
    rx:     ArrayLike<number>;
    ry:     ArrayLike<number>;
  }

  export interface HoverCallbackData {
    index: Int[] | Int[][];
    geometry: {
      type: "point" | "span";
      direction?: "h" | "v";
      x: ArrayLike<number>;
      y: ArrayLike<number>;
      sx: ArrayLike<number>;
      sy: ArrayLike<number>;
    };
  }

  export const HoverTool: { new(attributes?: IHoverTool, options?: ModelOpts): HoverTool };
  export interface HoverTool extends InspectTool, IHoverTool {}
  export interface IHoverTool extends IInspectTool, IHitTest {
    tooltips?: HTMLElement | [string, string][] | ((source: DataSource, info: HoverTooltipInfo) => HTMLElement);
    callback?: Callback | ((tool: HoverTool, data: HoverCallbackData) => void);
    mode?: HoverMode;
    point_policy?: PointPolicy;
    line_policy?: LinePolicy;
    anchor?: Anchor;
    attachment?: "horizontal" | "vertical";
    show_arrow?: boolean;
  }

  export const HelpTool: { new(attributes?: IHelpTool, options?: ModelOpts): HelpTool };
  export interface HelpTool extends Tool, IHelpTool {}
  export interface IHelpTool extends ITool {
    help_tooltip?: string;
    redirect?: string;
  }
}
