declare namespace Bokeh {
    export interface Glyph extends Model, IGlyph {}
    export interface IGlyph extends IModel {
        visible?: boolean;
    }

    export var AnnularWedge: { new(attributes?: IAnnularWedge, options?: KeyVal): AnnularWedge };
    export interface AnnularWedge extends Glyph, IAnnularWedge {}
    export interface IAnnularWedge extends IGlyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        inner_radius?: Spatial;
        outer_radius?: Spatial;
        start_angle?: Angular;
        end_angle?: Angular;
        direction?: Direction;
    }

    export var Annulus: { new(attributes?: IAnnulus, options?: KeyVal): Annulus };
    export interface Annulus extends Glyph, IAnnulus {}
    export interface IAnnulus extends IGlyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        inner_radius?: Spatial;
        outer_radius?: Spatial;
    }

    export var Arc: { new(attributes?: IArc, options?: KeyVal): Arc };
    export interface Arc extends Glyph, IArc {}
    export interface IArc extends IGlyph, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        radius?: Spatial;
        start_angle?: Angular;
        end_angle?: Angular;
        direction?: Direction;
    }

    export var Bezier: { new(attributes?: IBezier, options?: KeyVal): Bezier };
    export interface Bezier extends Glyph, IBezier {}
    export interface IBezier extends IGlyph, LineProps {
        x0?: Numerical | Categorical;
        y0?: Numerical | Categorical;
        x1?: Numerical | Categorical;
        y1?: Numerical | Categorical;
        cx0?: Numerical | Categorical;
        cy0?: Numerical | Categorical;
        cx1?: Numerical | Categorical;
        cy1?: Numerical | Categorical;
    }

    export var ImageRGBA: { new(attributes?: IImageRGBA, options?: KeyVal): ImageRGBA };
    export interface ImageRGBA extends Glyph, IImageRGBA {}
    export interface IImageRGBA extends IGlyph {
        image?: Vectorized<Array<number>>;
        rows?: Vectorized<Int>;
        cols?: Vectorized<Int>;
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        dw?: Spatial;
        dh?: Spatial;
        dilate?: boolean;
    }

    export var Image: { new(attributes?: IImage, options?: KeyVal): Image };
    export interface Image extends ImageRGBA, IImage {}
    export interface IImage extends IImageRGBA {
        color_mapper?: ColorMapper;
    }

    export var ImageURL: { new(attributes?: IImageURL, options?: KeyVal): ImageURL };
    export interface ImageURL extends Glyph, IImageURL {}
    export interface IImageURL extends IGlyph {
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

    export var Line: { new(attributes?: ILine, options?: KeyVal): Line };
    export interface Line extends Glyph, ILine {}
    export interface ILine extends IGlyph, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
    }

    export var MultiLine: { new(attributes?: IMultiLine, options?: KeyVal): MultiLine };
    export interface MultiLine extends Glyph, IMultiLine {}
    export interface IMultiLine extends IGlyph, LineProps {
        xs?: MultiNumerical | MultiCategorical;
        ys?: MultiNumerical | MultiCategorical;
    }

    export var Oval: { new(attributes?: IOval, options?: KeyVal): Oval };
    export interface Oval extends Glyph, IOval {}
    export interface IOval extends IGlyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        width?: Spatial;
        height?: Spatial;
        angle?: Angular;
    }

    export var Patch: { new(attributes?: IPatch, options?: KeyVal): Patch };
    export interface Patch extends Glyph, IPatch {}
    export interface IPatch extends IGlyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
    }

    export var Patches: { new(attributes?: IPatches, options?: KeyVal): Patches };
    export interface Patches extends Glyph, IPatches {}
    export interface IPatches extends IGlyph, LineProps, FillProps {
        xs?: MultiNumerical | MultiCategorical;
        ys?: MultiNumerical | MultiCategorical;
    }

    export var Quad: { new(attributes?: IQuad, options?: KeyVal): Quad };
    export interface Quad extends Glyph, IQuad {}
    export interface IQuad extends IGlyph, FillProps, LineProps {
        left?: Numerical | Categorical;
        right?: Numerical | Categorical;
        bottom?: Numerical | Categorical;
        top?: Numerical | Categorical;
    }

    export var Quadratic: { new(attributes?: IQuadratic, options?: KeyVal): Quadratic };
    export interface Quadratic extends Glyph, IQuadratic {}
    export interface IQuadratic extends IGlyph, LineProps {
        x0?: Numerical | Categorical;
        y0?: Numerical | Categorical;
        x1?: Numerical | Categorical;
        y1?: Numerical | Categorical;
        cx?: Numerical | Categorical;
        cy?: Numerical | Categorical;
    }

    export var Ray: { new(attributes?: IRay, options?: KeyVal): Ray };
    export interface Ray extends Glyph, IRay {}
    export interface IRay extends IGlyph, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        length?: Spatial;
        angle?: Angular;
    }

    export var Rect: { new(attributes?: IRect, options?: KeyVal): Rect };
    export interface Rect extends Glyph, IRect {}
    export interface IRect extends IGlyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        width?: Spatial;
        height?: Spatial;
        angle?: Angular;
        dilate?: boolean;
    }

    export var Segment: { new(attributes?: ISegment, options?: KeyVal): Segment };
    export interface Segment extends Glyph, ISegment {}
    export interface ISegment extends IGlyph, LineProps {
        x0?: Numerical | Categorical;
        y0?: Numerical | Categorical;
        x1?: Numerical | Categorical;
        y1?: Numerical | Categorical;
    }

    export var Text: { new(attributes?: IText, options?: KeyVal): Text };
    export interface Text extends Glyph, IText {}
    export interface IText extends IGlyph, TextProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        text?: Vectorized<string>;
        angle?: Angular;
        x_offset?: Spatial;
        y_offset?: Spatial;
    }

    export var Wedge: { new(attributes?: IWedge, options?: KeyVal): Wedge };
    export interface Wedge extends Glyph, IWedge {}
    export interface IWedge extends IGlyph, FillProps, LineProps {
        x?: Numerical | Categorical;
        y?: Numerical | Categorical;
        radius?: Spatial;
        start_angle?: Angular;
        end_angle?: Angular;
        direction?: Direction;
    }

    export var Gear: { new(attributes?: IGear, options?: KeyVal): Gear };
    export interface Gear extends Glyph, IGear {}
    export interface IGear extends IGlyph, LineProps, FillProps {
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
