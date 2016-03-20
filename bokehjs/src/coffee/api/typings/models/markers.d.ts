declare namespace Bokeh {
    export interface Marker extends Glyph, FillProps, LineProps {
        x: Numerical | Categorical;
        y: Numerical | Categorical;
        size: Spatial;
        angle: Angular;
    }

    export interface Asterisk extends Marker {}

    export interface Circle extends Marker {
        radius: Spatial;
        radius_dimension: Dimension;
    }

    export interface CircleCross extends Marker {}
    export interface CircleX extends Marker {}
    export interface Cross extends Marker {}
    export interface Diamond extends Marker {}
    export interface DiamondCross extends Marker {}
    export interface InvertedTriangle extends Marker {}
    export interface Square extends Marker {}
    export interface SquareCross extends Marker {}
    export interface SquareX extends Marker {}
    export interface Triangle extends Marker {}
    export interface X extends Marker {}
}
