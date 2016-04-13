declare namespace Bokeh {
    export interface ColorMapper extends Model, IColorMapper {}
    export interface IColorMapper extends IModel {}

    export var LinearColorMapper: { new(attributes?: ILinearColorMapper, options?: ModelOpts): LinearColorMapper };
    export interface LinearColorMapper extends ColorMapper, ILinearColorMapper {}
    export interface ILinearColorMapper extends IColorMapper {
        palette?: Palette | Array<Color>;

        low?: number;
        high?: number;

        reserve_color?: Color;
        reserve_val?: number;
    }
}
