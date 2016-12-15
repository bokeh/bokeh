declare namespace Bokeh {
 export interface IBackRef {
  plot?: Plot;
 }

 export var Plot: { new(attributes?: IPlot, options?: ModelOpts): Plot };
 export interface Plot extends LayoutDOM, IPlot {
  add_renderers(...Renderer: Array<Renderer>): void;
  add_layout(obj: Model, place?: Place): void;
  add_glyph(glyph: Glyph, source?: DataSource, attrs?: ModelOpts): GlyphRenderer;
  add_tools(...tools: Array<Tool>): void;
 }
 export interface IPlot extends IBasePlot {
  x_range?: Range;
  y_range?: Range;
 }
 export interface IBasePlot extends ILayoutDOM {
  toolbar?: Toolbar;
  toolbar_location?: Location;
  toolbar_sticky?: boolean;

  plot_width?: Int;
  plot_height?: Int;

  title?: Title | string;
  title_location?: Location;

  // {{{ outline = include[LineProps]
  outline_line_color?: Color;
  outline_line_width?: number;
  outline_line_alpha?: Percent;
  outline_line_join?: LineJoin;
  outline_line_cap?: LineCap;
  outline_line_dash?: DashPattern;
  outline_line_dash_offset?: Int;
  // }}}

  // {{{ background = include[FillProps]
  background_fill_color?: Color;
  background_fill_alpha?: Percent;
  // }}}

  // {{{ border = include[FillProps]
  border_fill_color?: Color;
  border_fill_alpha?: Percent;
  // }}}

  left?: Array<Renderer>;
  right?: Array<Renderer>;
  above?: Array<Renderer>;
  below?: Array<Renderer>;

  renderers?: Array<Renderer>;

  extra_x_ranges?: Map<Range>;
  extra_y_ranges?: Map<Range>;

  x_mapper_type?: Auto | "log";
  y_mapper_type?: Auto | "log";

  tool_events?: ToolEvents;

  min_border_top?: Int;
  min_border_bottom?: Int;
  min_border_left?: Int;
  min_border_right?: Int;
  min_border?: Int;

  h_symmetry?: boolean;
  v_symmetry?: boolean;

  lod_factor?: Int;
  lod_threshold?: Int;
  lod_interval?: Int;
  lod_timeout?: Int;

  webgl?: boolean;
  hidpi?: boolean;
 }
}
