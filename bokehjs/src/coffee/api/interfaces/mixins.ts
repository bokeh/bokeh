import {Vectorized} from "./vectorization";
import {LineJoin,LineCap,DashPattern,FontStyle,TextAlign,TextBaseline} from "./enums";
import {Int,Color,Percent,FontSize} from "./types";

export interface FillProps {
    fill_color: Vectorized<Color>;
    fill_alpha: Vectorized<Percent>;
}

export interface LineProps {
    line_color: Vectorized<Color>;
    line_width: Vectorized<number>;
    line_alpha: Vectorized<Percent>;
    line_join: LineJoin;
    line_cap: LineCap;
    line_dash: DashPattern;
    line_dash_offset: Int;
}

export interface TextProps {
    text_font: string;
    text_font_size: Vectorized<FontSize>;
    text_font_style: FontStyle;
    text_color: Vectorized<Color>;
    text_alpha: Vectorized<Percent>;
    text_align: TextAlign;
    text_baseline: TextBaseline;
}
