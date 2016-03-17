import {GuideRenderer} from "./renderers";
import {Ticker} from "./tickers";
import {Int} from "./types";

export interface Grid extends GuideRenderer {
    dimension: Int;
    ticker: Ticker;

    //grid = include[LineProps]
    //minor_grid = include[LineProps]
    //band = include[FillProps]
}
