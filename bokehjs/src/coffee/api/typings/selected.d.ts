declare namespace Bokeh {
  // get_view() returns null or View, but View is not typed yet
  export type Selected0d = {indices: Array<Int>, glyph?: Glyph, get_view(): any};
  export type Selected1d = {indices: Array<Int>};
  export type Selected2d = {indices: Array<Array<Int>>};

  export type Selected = { '0d': Selected0d, '1d': Selected1d, '2d': Selected2d };
}
