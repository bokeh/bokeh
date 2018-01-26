declare namespace Bokeh {
  export interface ColorMapper extends Transform, IColorMapper {}
  export interface IColorMapper extends ITransform {
    palette?: Color[];
    nan_color?: Color;
  }

  export const LinearColorMapper: { new(attributes?: ILinearColorMapper, options?: ModelOpts): LinearColorMapper };
  export interface LinearColorMapper extends ColorMapper, ILinearColorMapper {}
  export interface ILinearColorMapper extends IColorMapper {
    low?: number;
    high?: number;
    high_color?: Color;
    low_color?:  Color;
  }

  export const LogColorMapper: { new(attributes?: ILogColorMapper, options?: ModelOpts): LogColorMapper };
  export interface LogColorMapper extends ColorMapper, ILogColorMapper {}
  export interface ILogColorMapper extends IColorMapper {
    low?: number;
    high?: number;
    high_color?: Color;
    low_color?:  Color;
  }

  export const CategoricalColorMapper: { new(attributes?: ICategoricalColorMapper, options?: ModelOpts): CategoricalColorMapper };
  export interface CategoricalColorMapper extends ColorMapper, ICategoricalColorMapper {}
  export interface ICategoricalColorMapper extends IColorMapper {
    factors: string[] | Int[];
  }
}
