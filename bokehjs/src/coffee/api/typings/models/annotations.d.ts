declare namespace Bokeh {
    export interface Annotation extends Renderer, BackRef {
        level: RenderLevel;
    }

    export var Legend: { new(attributes?: KeyVal, options?: KeyVal): Legend };
    export interface Legend extends Annotation {
        location: LegendLocation;
        orientation: Orientation;

        //background = include[LineProps]
        //border = include[LineProps]
        //label = include[TextProps]

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
