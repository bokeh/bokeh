declare namespace Bokeh {
export type Field = string;

export interface Vectorized<T> {
    value?: T;
    field?: Field;
}

export interface Spatial extends Vectorized<number> {
    units?: SpatialUnits;
}

export interface Angular extends Vectorized<number>{
    units?: AngleUnits;
}

export type Numerical = Vectorized<number>;
export type Categorical = Vectorized<string>;

export type MultiNumerical = Vectorized<Array<number>>;
export type MultiCategorical = Vectorized<Array<string>>;
}
