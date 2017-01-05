declare namespace Bokeh {
  export interface Value<T> {
    value: T;
  }

  export interface Field {
    field: string;
  }

  export type Vectorized<T> = T | Value<T> | Field;

  export type Spatial = Vectorized<number> & {
    units?: SpatialUnits;
  }

  export type Angular = Vectorized<number> & {
    units?: AngleUnits;
  }

  export type Numerical = Vectorized<number>;
  export type Categorical = Vectorized<string>;

  export type MultiNumerical = Vectorized<Array<number>>;
  export type MultiCategorical = Vectorized<Array<string>>;
}
