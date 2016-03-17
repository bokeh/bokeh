import {GuideRenderer} from "./renderers";
import {Ticker} from "./tickers";
import {TickFormatter} from "./formatters";
import {Location,Orientation} from '../enums';
import {Int} from "../types";

export interface Axis extends GuideRenderer {
    visible: boolean;
    location: Location;

    ticker: Ticker;
    formatter: TickFormatter;

    axis_label: string;
    axis_label_standoff: Int;
    //axis_label = include[TextProps]

    major_label_standoff: Int;
    major_label_orientation: Orientation | number;
    //major_label = include[TextProps]

    //axis = include[LineProps]

    //major_tick = include[LineProps]
    major_tick_in: Int;
    major_tick_out: Int;

    //minor_tick = include[LineProps]
    minor_tick_in: Int;
    minor_tick_out: Int;
}

export interface ContinuousAxis extends Axis {}

export interface LinearAxis extends ContinuousAxis {}

export interface LogAxis extends ContinuousAxis {}

export interface CategoricalAxis extends Axis {}

export interface DatetimeAxis extends LinearAxis {
    scale: string;
    num_labels: Int;
    char_width: Int;
    fill_ratio: number;
}
