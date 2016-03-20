declare namespace Bokeh {
export type Int = number;
export type Percent = number;
export type Color = NamedColor       |
             [Int, Int, Int]         |  // RGB(r, g, b)
             [Int, Int, Int, Percent];  // RGBA(r, g, b, a)
export type FontSize = string;
}
