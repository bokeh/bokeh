declare namespace Bokeh {
  export interface Marker extends Glyph, IMarker {}
  export interface IMarker extends IGlyph, FillProps, LineProps {
    x?: Numerical | Categorical;
    y?: Numerical | Categorical;
    size?: Spatial;
    angle?: Angular;
  }

  export var Asterisk: { new(attributes?: IAsterisk, options?: ModelOpts): Asterisk };
  export interface Asterisk extends Marker, IAsterisk {}
  export interface IAsterisk extends IMarker {}

  export var Circle: { new(attributes?: ICircle, options?: ModelOpts): Circle };
  export interface Circle extends Marker, ICircle {}
  export interface ICircle extends IMarker {
    radius?: Spatial;
    radius_dimension?: Dimension;
  }

  export var CircleCross: { new(attributes?: ICircleCross, options?: ModelOpts): CircleCross };
  export interface CircleCross extends Marker, ICircleCross {}
  export interface ICircleCross extends IMarker {}

  export var CircleX: { new(attributes?: ICircleX, options?: ModelOpts): CircleX };
  export interface CircleX extends Marker, ICircleX {}
  export interface ICircleX extends IMarker {}

  export var Cross: { new(attributes?: ICross, options?: ModelOpts): Cross };
  export interface Cross extends Marker, ICross {}
  export interface ICross extends IMarker {}

  export var Diamond: { new(attributes?: IDiamond, options?: ModelOpts): Diamond };
  export interface Diamond extends Marker, IDiamond {}
  export interface IDiamond extends IMarker {}

  export var DiamondCross: { new(attributes?: IDiamondCross, options?: ModelOpts): DiamondCross };
  export interface DiamondCross extends Marker, IDiamondCross {}
  export interface IDiamondCross extends IMarker {}

  export var InvertedTriangle: { new(attributes?: IInvertedTriangle, options?: ModelOpts): InvertedTriangle };
  export interface InvertedTriangle extends Marker, IInvertedTriangle {}
  export interface IInvertedTriangle extends IMarker {}

  export var Square: { new(attributes?: ISquare, options?: ModelOpts): Square };
  export interface Square extends Marker, ISquare {}
  export interface ISquare extends IMarker {}

  export var SquareCross: { new(attributes?: ISquareCross, options?: ModelOpts): SquareCross };
  export interface SquareCross extends Marker, ISquareCross {}
  export interface ISquareCross extends IMarker {}

  export var SquareX: { new(attributes?: ISquareX, options?: ModelOpts): SquareX };
  export interface SquareX extends Marker, ISquareX {}
  export interface ISquareX extends IMarker {}

  export var Triangle: { new(attributes?: ITriangle, options?: ModelOpts): Triangle };
  export interface Triangle extends Marker, ITriangle {}
  export interface ITriangle extends IMarker {}

  export var X: { new(attributes?: IX, options?: ModelOpts): X };
  export interface X extends Marker, IX {}
  export interface IX extends IMarker {}
}
