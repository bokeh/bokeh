declare namespace Bokeh {
    export var Legend: { new(attributes?: ILegend, options?: ModelOpts): Legend };
    export interface Legend extends GuideRenderer, ILegend {}
    export interface ILegend extends IGuideRenderer {
        location?: LegendLocation;
        orientation?: Orientation;

        // {{{ background = include[FillProps]
        background_fill_color?: Color;
        background_fill_width?: number;
        background_fill_alpha?: Percent;
        background_fill_join?: LineJoin;
        background_fill_cap?: LineCap;
        background_fill_dash?: DashPattern;
        background_fill_dash_offset?: Int;
        // }}}

        // {{{ border = include[LineProps]
        border_line_color?: Color;
        border_line_width?: number;
        border_line_alpha?: Percent;
        border_line_join?: LineJoin;
        border_line_cap?: LineCap;
        border_line_dash?: DashPattern;
        border_line_dash_offset?: Int;
        // }}}

        // {{{ label = include[TextProps]
        label_text_font?: string;
        label_text_font_size?: FontSize;
        label_text_font_style?: FontStyle;
        label_text_color?: Color;
        label_text_alpha?: Percent;
        label_text_align?: TextAlign;
        label_text_baseline?: TextBaseline;
        // }}}

        label_standoff?: Int;
        label_height?: Int;
        label_width?: Int;

        glyph_height?: Int;
        glyph_width?: Int;

        legend_margin?: Int;
        legend_padding?: Int;
        legend_spacing?: Int;

        legends?: Array<[string, Array<GlyphRenderer>]>;
    }
}
