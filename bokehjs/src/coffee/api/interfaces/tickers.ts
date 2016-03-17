import {Model} from "./model";
import {Int} from "./types";

export interface Ticker extends Model {
    num_minor_ticks: Int;
    desired_num_ticks: Int;
}

export interface FixedTicker extends Ticker {
    ticks: Array<number>;
}

export interface AdaptiveTicker extends Ticker {
    base: number;
    mantissas: Array<number>;
    min_interval: number;
    max_interval: number;
}

export interface CompositeTicker extends Ticker {
    tickers: Array<Ticker>;
}

export interface SingleIntervalTicker extends Ticker {
    interval: number;
}

export interface DaysTicker extends SingleIntervalTicker {
    days: Array<Int>;
}

export interface MonthsTicker extends SingleIntervalTicker {
    months: Array<Int>;
}

export interface YearsTicker extends SingleIntervalTicker {}

export interface BasicTicker extends Ticker {}

export interface LogTicker extends AdaptiveTicker {}

export interface CategoricalTicker extends Ticker {}

export interface DatetimeTicker extends Ticker {}
