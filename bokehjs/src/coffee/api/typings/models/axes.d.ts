declare namespace Bokeh {
  export interface Axis extends GuideRenderer, IAxis {}
  export interface IAxis extends IGuideRenderer {
    visible?: boolean;
    location?: Location;

    ticker?: Ticker;
    formatter?: TickFormatter;

    axis_label?: string;
    axis_label_standoff?: Int;
    // {{{ axis_label = include[TextProps]
    axis_label_text_font?: string;
    axis_label_text_font_size?: FontSize;
    axis_label_text_font_style?: FontStyle;
    axis_label_text_color?: Color;
    axis_label_text_alpha?: Percent;
    axis_label_text_align?: TextAlign;
    axis_label_text_baseline?: TextBaseline;
    // }}}

    major_label_standoff?: Int;
    major_label_orientation?: Orientation | number;
    // {{{ major_label = include[TextProps]
    major_label_text_font?: string;
    major_label_text_font_size?: FontSize;
    major_label_text_font_style?: FontStyle;
    major_label_text_color?: Color;
    major_label_text_alpha?: Percent;
    major_label_text_align?: TextAlign;
    major_label_text_baseline?: TextBaseline;
    // }}}

    // {{{ outline = include[LineProps]
    axis_line_color?: Color;
    axis_line_width?: number;
    axis_line_alpha?: Percent;
    axis_line_join?: LineJoin;
    axis_line_cap?: LineCap;
    axis_line_dash?: DashPattern;
    axis_line_dash_offset?: Int;
    // }}}

    major_tick_in?: Int;
    major_tick_out?: Int;
    // {{{ major_tick = include[LineProps]
    major_tick_line_color?: Color;
    major_tick_line_width?: number;
    major_tick_line_alpha?: Percent;
    major_tick_line_join?: LineJoin;
    major_tick_line_cap?: LineCap;
    major_tick_line_dash?: DashPattern;
    major_tick_line_dash_offset?: Int;
    // }}}

    minor_tick_in?: Int;
    minor_tick_out?: Int;
    // {{{ minor_tick = include[LineProps]
    minor_tick_line_color?: Color;
    minor_tick_line_width?: number;
    minor_tick_line_alpha?: Percent;
    minor_tick_line_join?: LineJoin;
    minor_tick_line_cap?: LineCap;
    minor_tick_line_dash?: DashPattern;
    minor_tick_line_dash_offset?: Int;
    // }}
  }

  export interface ContinuousAxis extends Axis, IContinuousAxis {}
  export interface IContinuousAxis extends IAxis {}

  export var LinearAxis: { new(attributes?: ILinearAxis, options?: ModelOpts): LinearAxis };
  export interface LinearAxis extends ContinuousAxis, ILinearAxis {}
  export interface ILinearAxis extends IContinuousAxis {}

  export var LogAxis: { new(attributes?: ILogAxis, options?: ModelOpts): LogAxis };
  export interface LogAxis extends ContinuousAxis, ILogAxis {}
  export interface ILogAxis extends IContinuousAxis {}

  export var CategoricalAxis: { new(attributes?: ICategoricalAxis, options?: ModelOpts): CategoricalAxis };
  export interface CategoricalAxis extends Axis, ICategoricalAxis {}
  export interface ICategoricalAxis extends IAxis {}

  export var DatetimeAxis: { new(attributes?: IDatetimeAxis, options?: ModelOpts): DatetimeAxis };
  export interface DatetimeAxis extends LinearAxis, IDatetimeAxis {}
  export interface IDatetimeAxis extends ILinearAxis {
    scale?: string;
    num_labels?: Int;
    char_width?: Int;
    fill_ratio?: number;
  }
}
