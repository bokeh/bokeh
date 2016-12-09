declare namespace Bokeh {
  export interface Mapper extends Model, IMapper {}
  export interface IMapper extends IModel {}

  export interface ColorMapper extends Mapper, IColorMapper {}
  export interface IColorMapper extends IMapper {
    palette?: Array<Color>;
    nan_color?: Color;
  }

  export var LinearColorMapper: { new(attributes?: ILinearColorMapper, options?: ModelOpts): LinearColorMapper };
  export interface LinearColorMapper extends ColorMapper, ILinearColorMapper {}
  export interface ILinearColorMapper extends IColorMapper {
    low?: number;
    high?: number;
    high_color?: Color;
    low_color?:  Color;
  }

  export var LogColorMapper: { new(attributes?: ILogColorMapper, options?: ModelOpts): LogColorMapper };
  export interface LogColorMapper extends ColorMapper, ILogColorMapper {}
  export interface ILogColorMapper extends IColorMapper {
    low?: number;
    high?: number;
    high_color?: Color;
    low_color?:  Color;
  }

  export var CategoricalColorMapper: { new(attributes?: ICategoricalColorMapper, options?: ModelOpts): CategoricalColorMapper };
  export interface CategoricalColorMapper extends ColorMapper, ICategoricalColorMapper {}
  export interface ICategoricalColorMapper extends IColorMapper {
    factors: Array<string> | Array<Int>;
  }
}
