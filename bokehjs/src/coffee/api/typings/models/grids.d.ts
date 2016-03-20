declare namespace Bokeh {
    export var Grid: { new(): Grid };
    export interface Grid extends GuideRenderer {
        dimension: Int;
        ticker: Ticker;

        //grid = include[LineProps]
        //minor_grid = include[LineProps]
        //band = include[FillProps]
    }
}
