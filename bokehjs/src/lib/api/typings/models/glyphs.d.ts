declare namespace Bokeh {
  export interface Glyph extends Model, IGlyph {}
  export interface IGlyph extends IModel {
    visible?: boolean;
  }

  export const AnnularWedge: { new(attributes?: IAnnularWedge, options?: ModelOpts): AnnularWedge };
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

  export const Annulus: { new(attributes?: IAnnulus, options?: ModelOpts): Annulus };
  export interface Annulus extends Glyph, IAnnulus {}
  export interface IAnnulus extends IGlyph, FillProps, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    inner_radius?: Spatial;
    outer_radius?: Spatial;
  }

  export const Arc: { new(attributes?: IArc, options?: ModelOpts): Arc };
  export interface Arc extends Glyph, IArc {}
  export interface IArc extends IGlyph, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    radius?: Spatial;
    start_angle?: Angular;
    end_angle?: Angular;
    direction?: Direction;
  }

  export const Bezier: { new(attributes?: IBezier, options?: ModelOpts): Bezier };
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

  export const Ellipse: { new(attributes?: IEllipse, options?: ModelOpts): Ellipse };
  export interface Ellipse extends Glyph, IEllipse {}
  export interface IEllipse extends IGlyph, FillProps, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    width?: Spatial;
    height?: Spatial;
    angle?: Angular;
  }

  export const ImageRGBA: { new(attributes?: IImageRGBA, options?: ModelOpts): ImageRGBA };
  export interface ImageRGBA extends Glyph, IImageRGBA {}
  export interface IImageRGBA extends IGlyph {
    image?: Vectorized<number[]>;
    rows?: Vectorized<Int>;
    cols?: Vectorized<Int>;
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    dw?: Spatial;
    dh?: Spatial;
    dilate?: boolean;
  }

  export const Image: { new(attributes?: IImage, options?: ModelOpts): Image };
  export interface Image extends ImageRGBA, IImage {}
  export interface IImage extends IImageRGBA {
    color_mapper?: ColorMapper;
  }

  export const ImageURL: { new(attributes?: IImageURL, options?: ModelOpts): ImageURL };
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

  export const Line: { new(attributes?: ILine, options?: ModelOpts): Line };
  export interface Line extends Glyph, ILine {}
  export interface ILine extends IGlyph, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
  }

  export const MultiLine: { new(attributes?: IMultiLine, options?: ModelOpts): MultiLine };
  export interface MultiLine extends Glyph, IMultiLine {}
  export interface IMultiLine extends IGlyph, LineProps {
    xs?: MultiNumerical | MultiCategorical;
    ys?: MultiNumerical | MultiCategorical;
  }


  export const MultiPolygons: { new(attributes?: IMultiPolygons, options?: ModelOpts): MultiPolygons };
  export interface MultiPolygons extends Glyph, IMultiPolygons { }
  export interface IMultiPolygons extends IGlyph, FillProps, LineProps {
    xs?: MultiNumerical | MultiCategorical;
    ys?: MultiNumerical | MultiCategorical;
  }

  export const Oval: { new(attributes?: IOval, options?: ModelOpts): Oval };
  export interface Oval extends Glyph, IOval {}
  export interface IOval extends IGlyph, FillProps, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    width?: Spatial;
    height?: Spatial;
    angle?: Angular;
  }

  export const Patch: { new(attributes?: IPatch, options?: ModelOpts): Patch };
  export interface Patch extends Glyph, IPatch {}
  export interface IPatch extends IGlyph, FillProps, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
  }

  export const Patches: { new(attributes?: IPatches, options?: ModelOpts): Patches };
  export interface Patches extends Glyph, IPatches {}
  export interface IPatches extends IGlyph, LineProps, FillProps {
    xs?: MultiNumerical | MultiCategorical;
    ys?: MultiNumerical | MultiCategorical;
  }

  export const Quad: { new(attributes?: IQuad, options?: ModelOpts): Quad };
  export interface Quad extends Glyph, IQuad {}
  export interface IQuad extends IGlyph, FillProps, LineProps {
    left?: Numerical | Categorical;
    right?: Numerical | Categorical;
    bottom?: Numerical | Categorical;
    top?: Numerical | Categorical;
  }

  export const Quadratic: { new(attributes?: IQuadratic, options?: ModelOpts): Quadratic };
  export interface Quadratic extends Glyph, IQuadratic {}
  export interface IQuadratic extends IGlyph, LineProps {
    x0?: Numerical | Categorical;
    y0?: Numerical | Categorical;
    x1?: Numerical | Categorical;
    y1?: Numerical | Categorical;
    cx?: Numerical | Categorical;
    cy?: Numerical | Categorical;
  }

  export const Ray: { new(attributes?: IRay, options?: ModelOpts): Ray };
  export interface Ray extends Glyph, IRay {}
  export interface IRay extends IGlyph, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    length?: Spatial;
    angle?: Angular;
  }

  export const Rect: { new(attributes?: IRect, options?: ModelOpts): Rect };
  export interface Rect extends Glyph, IRect {}
  export interface IRect extends IGlyph, FillProps, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    width?: Spatial;
    height?: Spatial;
    angle?: Angular;
    dilate?: boolean;
  }

  export const Segment: { new(attributes?: ISegment, options?: ModelOpts): Segment };
  export interface Segment extends Glyph, ISegment {}
  export interface ISegment extends IGlyph, LineProps {
    x0?: Numerical | Categorical;
    y0?: Numerical | Categorical;
    x1?: Numerical | Categorical;
    y1?: Numerical | Categorical;
  }

  export const Step: { new(attributes?: IStep, options?: ModelOpts): Step };
  export interface Step extends Glyph, IStep {}
  export interface IStep extends IGlyph, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    mode?: StepType;
  }

  export const Text: { new(attributes?: IText, options?: ModelOpts): Text };
  export interface Text extends Glyph, IText {}
  export interface IText extends IGlyph, TextProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    text?: Vectorized<string>;
    angle?: Angular;
    x_offset?: Spatial;
    y_offset?: Spatial;
  }

  export const Wedge: { new(attributes?: IWedge, options?: ModelOpts): Wedge };
  export interface Wedge extends Glyph, IWedge {}
  export interface IWedge extends IGlyph, FillProps, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    radius?: Spatial;
    start_angle?: Angular;
    end_angle?: Angular;
    direction?: Direction;
  }
}
