declare namespace Bokeh {
    export interface Grid extends GuideRenderer {
        dimension: Int;
        ticker: Ticker;

        //grid = include[LineProps]
        //minor_grid = include[LineProps]
        //band = include[FillProps]
    }
}
