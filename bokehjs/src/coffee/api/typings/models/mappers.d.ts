declare namespace Bokeh {
  export interface ColorMapper extends Model, IColorMapper {}
  export interface IColorMapper extends IModel {}

  export var LinearColorMapper: { new(attributes?: ILinearColorMapper, options?: ModelOpts): LinearColorMapper };
  export interface LinearColorMapper extends ColorMapper, ILinearColorMapper {}
  export interface ILinearColorMapper extends IColorMapper {
    palette?: Array<Color>;

    low?: number;
    high?: number;

    nan_color?: Color;
  }
}
