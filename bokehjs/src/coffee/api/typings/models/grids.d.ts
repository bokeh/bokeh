declare namespace Bokeh {
  export const Grid: { new(attributes?: IGrid, options?: ModelOpts): Grid };
  export interface Grid extends GuideRenderer, IGrid {}
  export interface IGrid extends IGuideRenderer {
    dimension?: Int;
    ticker?: Ticker;

    // {{{ grid = include[LineProps]
    grid_line_color?: Color;
    grid_line_width?: number;
    grid_line_alpha?: Percent;
    grid_line_join?: LineJoin;
    grid_line_cap?: LineCap;
    grid_line_dash?: DashPattern;
    grid_line_dash_offset?: Int;
    // }}}

    // {{{ minor_grid = include[LineProps]
    minor_grid_line_color?: Color;
    minor_grid_line_width?: number;
    minor_grid_line_alpha?: Percent;
    minor_grid_line_join?: LineJoin;
    minor_grid_line_cap?: LineCap;
    minor_grid_line_dash?: DashPattern;
    minor_grid_line_dash_offset?: Int;
    // }}}

    // {{ band = include[FillProps]
    band_fill_color?: Color;
    band_fill_alpha?: Percent;
    // }}}
  }
}
