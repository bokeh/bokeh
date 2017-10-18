declare namespace Bokeh {
  export type Int = number;
  export type Percent = number;
  export type Color = NamedColor       |
            string           |
            [Int, Int, Int]         |  // RGB (r, g, b)
            [Int, Int, Int, Percent];  // RGBA(r, g, b, a)
  export type FontSize = string;
  export type Map<T> = {[key: string]: T};
  export type JsObj = Map<any>;
}
