declare namespace Bokeh {
    export interface Glyph extends Model {
        visible?: boolean;
    }

    export var AnnularWedge: { new(attributes?: KeyVal, options?: KeyVal): AnnularWedge };
    export interface AnnularWedge extends Glyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        inner_radius?: Spatial;
        outer_radius?: Spatial;
        start_angle?: Angular;
        end_angle?: Angular;
        direction?: Direction;
    }

    export var Annulus: { new(attributes?: KeyVal, options?: KeyVal): Annulus };
    export interface Annulus extends Glyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        inner_radius?: Spatial;
        outer_radius?: Spatial;
    }

    export var Arc: { new(attributes?: KeyVal, options?: KeyVal): Arc };
    export interface Arc extends Glyph, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        radius?: Spatial;
        start_angle?: Angular;
        end_angle?: Angular;
        direction?: Direction;
    }

    export var Bezier: { new(attributes?: KeyVal, options?: KeyVal): Bezier };
    export interface Bezier extends Glyph, LineProps {
        x0?: Numerical | Categorical;
        y0?: Numerical | Categorical;
        x1?: Numerical | Categorical;
        y1?: Numerical | Categorical;
        cx0?: Numerical | Categorical;
        cy0?: Numerical | Categorical;
        cx1?: Numerical | Categorical;
        cy1?: Numerical | Categorical;
    }

    export var ImageRGBA: { new(attributes?: KeyVal, options?: KeyVal): ImageRGBA };
    export interface ImageRGBA extends Glyph {
        image?: Vectorized<Array<number>>;
        rows?: Vectorized<Int>;
        cols?: Vectorized<Int>;
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        dw?: Spatial;
        dh?: Spatial;
        dilate?: boolean;
    }

    export var Image: { new(attributes?: KeyVal, options?: KeyVal): Image };
    export interface Image extends ImageRGBA {
        color_mapper?: ColorMapper;
    }

    export var ImageURL: { new(attributes?: KeyVal, options?: KeyVal): ImageURL };
    export interface ImageURL extends Glyph {
        url?: Vectorized<string>;
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        w?: Spatial;
        h?: Spatial;
        angle?: Angular;
        global_alpha?: Percent;
        dilate?: boolean;
        anchor?: Anchor;
        retry_attempts?: Int;
        retry_timeout?: Int;
    }

    export var Line: { new(attributes?: KeyVal, options?: KeyVal): Line };
    export interface Line extends Glyph, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
    }

    export var MultiLine: { new(attributes?: KeyVal, options?: KeyVal): MultiLine };
    export interface MultiLine extends Glyph, LineProps {
        xs?: MultiNumerical | MultiCategorical;
        ys?: MultiNumerical | MultiCategorical;
    }

    export var Oval: { new(attributes?: KeyVal, options?: KeyVal): Oval };
    export interface Oval extends Glyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        width?: Spatial;
        height?: Spatial;
        angle?: Angular;
    }

    export var Patch: { new(attributes?: KeyVal, options?: KeyVal): Patch };
    export interface Patch extends Glyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
    }

    export var Patches: { new(attributes?: KeyVal, options?: KeyVal): Patches };
    export interface Patches extends Glyph, LineProps, FillProps {
        xs?: MultiNumerical | MultiCategorical;
        ys?: MultiNumerical | MultiCategorical;
    }

    export var Quad: { new(attributes?: KeyVal, options?: KeyVal): Quad };
    export interface Quad extends Glyph, FillProps, LineProps {
        left?: Numerical | Categorical;
        right?: Numerical | Categorical;
        bottom?: Numerical | Categorical;
        top?: Numerical | Categorical;
    }

    export var Quadratic: { new(attributes?: KeyVal, options?: KeyVal): Quadratic };
    export interface Quadratic extends Glyph, LineProps {
        x0?: Numerical | Categorical;
        y0?: Numerical | Categorical;
        x1?: Numerical | Categorical;
        y1?: Numerical | Categorical;
        cx?: Numerical | Categorical;
        cy?: Numerical | Categorical;
    }

    export var Ray: { new(attributes?: KeyVal, options?: KeyVal): Ray };
    export interface Ray extends Glyph, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        length?: Spatial;
        angle?: Angular;
    }

    export var Rect: { new(attributes?: KeyVal, options?: KeyVal): Rect };
    export interface Rect extends Glyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        width?: Spatial;
        height?: Spatial;
        angle?: Angular;
        dilate?: boolean;
    }

    export var Segment: { new(attributes?: KeyVal, options?: KeyVal): Segment };
    export interface Segment extends Glyph, LineProps {
        x0?: Numerical | Categorical;
        y0?: Numerical | Categorical;
        x1?: Numerical | Categorical;
        y1?: Numerical | Categorical;
    }

    export var Text: { new(attributes?: KeyVal, options?: KeyVal): Text };
    export interface Text extends Glyph, TextProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        text?: Vectorized<string>;
        angle?: Angular;
        x_offset?: Spatial;
        y_offset?: Spatial;
    }

    export var Wedge: { new(attributes?: KeyVal, options?: KeyVal): Wedge };
    export interface Wedge extends Glyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        radius?: Spatial;
        start_angle?: Angular;
        end_angle?: Angular;
        direction?: Direction;
    }

    export var Gear: { new(attributes?: KeyVal, options?: KeyVal): Gear };
    export interface Gear extends Glyph, LineProps, FillProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        angle?: Angular;
        module?: Vectorized<number>;
        teeth?: Vectorized<Int>;
        pressure_angle?: Angular;
        shaft_size?: Vectorized<number>;
        internal?: Vectorized<boolean>;
    }
}
