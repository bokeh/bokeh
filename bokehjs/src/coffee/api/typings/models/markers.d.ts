declare namespace Bokeh {
    export interface Marker extends Glyph, FillProps, LineProps {
        x: Numerical | Categorical;
        y: Numerical | Categorical;
        size: Spatial;
        angle: Angular;
    }

    export var Asterisk: { new(): Asterisk };
    export interface Asterisk extends Marker {}

    export var Circle: { new(): Circle };
    export interface Circle extends Marker {
        radius: Spatial;
        radius_dimension: Dimension;
    }

    export var CircleCross: { new(): CircleCross };
    export interface CircleCross extends Marker {}

    export var CircleX: { new(): CircleX };
    export interface CircleX extends Marker {}

    export var Cross: { new(): Cross };
    export interface Cross extends Marker {}

    export var Diamond: { new(): Diamond };
    export interface Diamond extends Marker {}

    export var DiamondCross: { new(): DiamondCross };
    export interface DiamondCross extends Marker {}

    export var InvertedTriangle: { new(): InvertedTriangle };
    export interface InvertedTriangle extends Marker {}

    export var Square: { new(): Square };
    export interface Square extends Marker {}

    export var SquareCross: { new(): SquareCross };
    export interface SquareCross extends Marker {}

    export var SquareX: { new(): SquareX };
    export interface SquareX extends Marker {}

    export var Triangle: { new(): Triangle };
    export interface Triangle extends Marker {}

    export var X: { new(): X };
    export interface X extends Marker {}
}
