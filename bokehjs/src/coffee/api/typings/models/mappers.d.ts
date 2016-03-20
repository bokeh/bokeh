declare namespace Bokeh {
    export interface ColorMapper extends Model {}

    export interface LinearColorMapper extends ColorMapper {
        palette: Palette | Array<Color>;

        low: number;
        high: number;

        reserve_color: Color;
        reserve_val: number;
    }
}
