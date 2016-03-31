declare namespace Bokeh {
    export interface Annotation extends Renderer, BackRef {
        level: RenderLevel;
    }

    export var Legend: { new(attributes?: KeyVal, options?: KeyVal): Legend };
    export interface Legend extends Annotation {
        location: LegendLocation;
        orientation: Orientation;

        // {{{ background = include[LineProps]
        background_line_color: Color;
        background_line_width: number;
        background_line_alpha: Percent;
        background_line_join: LineJoin;
        background_line_cap: LineCap;
        background_line_dash: DashPattern;
        background_line_dash_offset: Int;
        // }}}

        // {{{ border = include[LineProps]
        border_line_color: Color;
        border_line_width: number;
        border_line_alpha: Percent;
        border_line_join: LineJoin;
        border_line_cap: LineCap;
        border_line_dash: DashPattern;
        border_line_dash_offset: Int;
        // }}}

        // {{{ label = include[TextProps]
        label_text_font: string;
        label_text_font_size: FontSize;
        label_text_font_style: FontStyle;
        label_text_color: Color;
        label_text_alpha: Percent;
        label_text_align: TextAlign;
        label_text_baseline: TextBaseline;
        // }}}

        label_standoff: Int;
        label_height: Int;
        label_width: Int;

        glyph_height: Int;
        glyph_width: Int;

        legend_padding: Int;
        legend_spacing: Int;

        legends: Array<[string, Array<GlyphRenderer>]>;
    }

    export var BoxAnnotation: { new(attributes?: KeyVal, options?: KeyVal): BoxAnnotation };
    export interface BoxAnnotation extends Annotation, LineProps, FillProps {
        left: Auto | Numerical;
        left_units: SpatialUnits;

        right: Auto | Numerical;
        right_units: SpatialUnits;

        bottom: Auto | Numerical;
        bottom_units: SpatialUnits;

        top: Auto | Numerical;
        top_units: SpatialUnits;

        x_range_name: string;
        y_range_name: string;

        render_mode: RenderMode;
    }

    export var PolyAnnotation: { new(attributes?: KeyVal, options?: KeyVal): PolyAnnotation };
    export interface PolyAnnotation extends Annotation, LineProps, FillProps {
        xs: Array<number>;
        xs_units: SpatialUnits;

        ys: Array<number>;
        ys_units: SpatialUnits;

        x_range_name: string;
        y_range_name: string;
    }

    export var Span: { new(attributes?: KeyVal, options?: KeyVal): Span };
    export interface Span extends Annotation, LineProps {
        location: number;
        location_units: SpatialUnits;

        dimension: Dimension;

        x_range_name: string;
        y_range_name: string;

        render_mode: RenderMode;
    }

    export var Overlay: { new(attributes?: KeyVal, options?: KeyVal): Overlay };
    export interface Overlay extends Annotation {}

    export var Tooltip: { new(attributes?: KeyVal, options?: KeyVal): Tooltip };
    export interface Tooltip extends Overlay {
        side: Auto | Side;
        inner_only: boolean;
    }
}
