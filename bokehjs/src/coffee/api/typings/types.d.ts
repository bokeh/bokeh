declare namespace Bokeh {
    export type Int = number;
    export type Percent = number;
    export type Color = NamedColor       |
                        String           |
                        [Int, Int, Int]         |  // RGB (r, g, b)
                        [Int, Int, Int, Percent];  // RGBA(r, g, b, a)
    export type FontSize = string;
    export type KeyVal = {[key: string]: any};
}
