declare namespace Bokeh {
    export interface Marker extends Glyph, FillProps, LineProps {
        x: Numerical | Categorical;
        y: Numerical | Categorical;
        size: Spatial;
        angle: Angular;
    }

    export var Asterisk: { new(attributes?: KeyVal, options?: KeyVal): Asterisk };
    export interface Asterisk extends Marker {}

    export var Circle: { new(attributes?: KeyVal, options?: KeyVal): Circle };
    export interface Circle extends Marker {
        radius: Spatial;
        radius_dimension: Dimension;
    }

    export var CircleCross: { new(attributes?: KeyVal, options?: KeyVal): CircleCross };
    export interface CircleCross extends Marker {}

    export var CircleX: { new(attributes?: KeyVal, options?: KeyVal): CircleX };
    export interface CircleX extends Marker {}

    export var Cross: { new(attributes?: KeyVal, options?: KeyVal): Cross };
    export interface Cross extends Marker {}

    export var Diamond: { new(attributes?: KeyVal, options?: KeyVal): Diamond };
    export interface Diamond extends Marker {}

    export var DiamondCross: { new(attributes?: KeyVal, options?: KeyVal): DiamondCross };
    export interface DiamondCross extends Marker {}

    export var InvertedTriangle: { new(attributes?: KeyVal, options?: KeyVal): InvertedTriangle };
    export interface InvertedTriangle extends Marker {}

    export var Square: { new(attributes?: KeyVal, options?: KeyVal): Square };
    export interface Square extends Marker {}

    export var SquareCross: { new(attributes?: KeyVal, options?: KeyVal): SquareCross };
    export interface SquareCross extends Marker {}

    export var SquareX: { new(attributes?: KeyVal, options?: KeyVal): SquareX };
    export interface SquareX extends Marker {}

    export var Triangle: { new(attributes?: KeyVal, options?: KeyVal): Triangle };
    export interface Triangle extends Marker {}

    export var X: { new(attributes?: KeyVal, options?: KeyVal): X };
    export interface X extends Marker {}
}
