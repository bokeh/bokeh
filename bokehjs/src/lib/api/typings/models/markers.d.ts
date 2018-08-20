declare namespace Bokeh {
  export interface Marker extends Glyph, IMarker {}
  export interface IMarker extends IGlyph, FillProps, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    size?: Spatial;
    angle?: Angular;
  }

  export const Asterisk: { new(attributes?: IAsterisk, options?: ModelOpts): Asterisk };
  export interface Asterisk extends Marker, IAsterisk {}
  export interface IAsterisk extends IMarker {}

  export const Circle: { new(attributes?: ICircle, options?: ModelOpts): Circle };
  export interface Circle extends Marker, ICircle {}
  export interface ICircle extends IMarker {
    radius?: Spatial;
    radius_dimension?: Dimension;
  }

  export const CircleCross: { new(attributes?: ICircleCross, options?: ModelOpts): CircleCross };
  export interface CircleCross extends Marker, ICircleCross {}
  export interface ICircleCross extends IMarker {}

  export const CircleX: { new(attributes?: ICircleX, options?: ModelOpts): CircleX };
  export interface CircleX extends Marker, ICircleX {}
  export interface ICircleX extends IMarker {}

  export const Cross: { new(attributes?: ICross, options?: ModelOpts): Cross };
  export interface Cross extends Marker, ICross {}
  export interface ICross extends IMarker {}

  export const Dash: { new(attributes?: IDash, options?: ModelOpts): Dash };
  export interface Dash extends Marker, IDash {}
  export interface IDash extends IMarker {}

  export const Diamond: { new(attributes?: IDiamond, options?: ModelOpts): Diamond };
  export interface Diamond extends Marker, IDiamond {}
  export interface IDiamond extends IMarker {}

  export const DiamondCross: { new(attributes?: IDiamondCross, options?: ModelOpts): DiamondCross };
  export interface DiamondCross extends Marker, IDiamondCross {}
  export interface IDiamondCross extends IMarker {}

  export const InvertedTriangle: { new(attributes?: IInvertedTriangle, options?: ModelOpts): InvertedTriangle };
  export interface InvertedTriangle extends Marker, IInvertedTriangle {}
  export interface IInvertedTriangle extends IMarker {}

  export const Square: { new(attributes?: ISquare, options?: ModelOpts): Square };
  export interface Square extends Marker, ISquare {}
  export interface ISquare extends IMarker {}

  export const SquareCross: { new(attributes?: ISquareCross, options?: ModelOpts): SquareCross };
  export interface SquareCross extends Marker, ISquareCross {}
  export interface ISquareCross extends IMarker {}

  export const SquareX: { new(attributes?: ISquareX, options?: ModelOpts): SquareX };
  export interface SquareX extends Marker, ISquareX {}
  export interface ISquareX extends IMarker {}

  export const Triangle: { new(attributes?: ITriangle, options?: ModelOpts): Triangle };
  export interface Triangle extends Marker, ITriangle {}
  export interface ITriangle extends IMarker {}

  export const X: { new(attributes?: IX, options?: ModelOpts): X };
  export interface X extends Marker, IX {}
  export interface IX extends IMarker {}
}
