import {Model} from "./model";
import {FillProps,LineProps,TextProps} from "./mixins";
import {Vectorized,Spatial,Angular,Numerical,Categorical,MultiNumerical,MultiCategorical} from "../vectorization";
import {ColorMapper} from "./mappers";
import {Direction,Anchor} from "../enums";
import {Int,Percent} from "../types";

export interface Glyph extends Model {
    visible: boolean;
}

export interface AnnularWedge extends Glyph, FillProps, LineProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    inner_radius: Spatial;
    outer_radius: Spatial;
    start_angle: Angular;
    end_angle: Angular;
    direction: Direction;
}

export interface Annulus extends Glyph, FillProps, LineProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    inner_radius: Spatial;
    outer_radius: Spatial;
}

export interface Arc extends Glyph, LineProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    radius: Spatial;
    start_angle: Angular;
    end_angle: Angular;
    direction: Direction;
}

export interface Bezier extends Glyph, LineProps {
    x0: Numerical | Categorical;
    y0: Numerical | Categorical;
    x1: Numerical | Categorical;
    y1: Numerical | Categorical;
    cx0: Numerical | Categorical;
    cy0: Numerical | Categorical;
    cx1: Numerical | Categorical;
    cy1: Numerical | Categorical;
}

export interface ImageRGBA extends Glyph {
    image: Vectorized<Array<number>>;
    rows: Vectorized<Int>;
    cols: Vectorized<Int>;
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    dw: Spatial;
    dh: Spatial;
    dilate: boolean;
}

export interface Image extends ImageRGBA {
    color_mapper: ColorMapper;
}

export interface ImageURL extends Glyph {
    url: Vectorized<string>;
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    w: Spatial;
    h: Spatial;
    angle: Angular;
    global_alpha: Percent;
    dilate: boolean;
    anchor: Anchor;
    retry_attempts: Int;
    retry_timeout: Int;
}

export interface Line extends Glyph, LineProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
}

export interface MultiLine extends Glyph, LineProps {
    xs: MultiNumerical | MultiCategorical;
    ys: MultiNumerical | MultiCategorical;
}

export interface Oval extends Glyph, FillProps, LineProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    width: Spatial;
    height: Spatial;
    angle: Angular;
}

export interface Patch extends Glyph, FillProps, LineProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
}

export interface Patches extends Glyph, LineProps, FillProps {
    xs: MultiNumerical | MultiCategorical;
    ys: MultiNumerical | MultiCategorical;
}

export interface Quad extends Glyph, FillProps, LineProps {
    left: Numerical | Categorical;
    right: Numerical | Categorical;
    bottom: Numerical | Categorical;
    top: Numerical | Categorical;
}

export interface Quadratic extends Glyph, LineProps {
    x0: Numerical | Categorical;
    y0: Numerical | Categorical;
    x1: Numerical | Categorical;
    y1: Numerical | Categorical;
    cx: Numerical | Categorical;
    cy: Numerical | Categorical;
}

export interface Ray extends Glyph, LineProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    length: Spatial;
    angle: Angular;
}

export interface Rect extends Glyph, FillProps, LineProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    width: Spatial;
    height: Spatial;
    angle: Angular;
    dilate: boolean;
}

export interface Segment extends Glyph, LineProps {
    x0: Numerical | Categorical;
    y0: Numerical | Categorical;
    x1: Numerical | Categorical;
    y1: Numerical | Categorical;
}

export interface Text extends Glyph, TextProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    text: Vectorized<string>;
    angle: Angular;
    x_offset: Spatial;
    y_offset: Spatial;
}

export interface Wedge extends Glyph, FillProps, LineProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    radius: Spatial;
    start_angle: Angular;
    end_angle: Angular;
    direction: Direction;
}

export interface Gear extends Glyph, LineProps, FillProps {
    x: Numerical | Categorical;
    y: Numerical | Categorical;
    angle: Angular;
    module: Vectorized<number>;
    teeth: Vectorized<Int>;
    pressure_angle: Angular;
    shaft_size: Vectorized<number>;
    internal: Vectorized<boolean>;
}
