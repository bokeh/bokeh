declare namespace Bokeh {
    export interface Ticker extends Model {
        num_minor_ticks: Int;
        desired_num_ticks: Int;
    }

    export var FixedTicker: { new(attributes?: KeyVal, options?: KeyVal): FixedTicker };
    export interface FixedTicker extends Ticker {
        ticks: Array<number>;
    }

    export var AdaptiveTicker: { new(attributes?: KeyVal, options?: KeyVal): AdaptiveTicker };
    export interface AdaptiveTicker extends Ticker {
        base: number;
        mantissas: Array<number>;
        min_interval: number;
        max_interval: number;
    }

    export var CompositeTicker: { new(attributes?: KeyVal, options?: KeyVal): CompositeTicker };
    export interface CompositeTicker extends Ticker {
        tickers: Array<Ticker>;
    }

    export var SingleIntervalTicker: { new(attributes?: KeyVal, options?: KeyVal): SingleIntervalTicker };
    export interface SingleIntervalTicker extends Ticker {
        interval: number;
    }

    export var DaysTicker: { new(attributes?: KeyVal, options?: KeyVal): DaysTicker };
    export interface DaysTicker extends SingleIntervalTicker {
        days: Array<Int>;
    }

    export var MonthsTicker: { new(attributes?: KeyVal, options?: KeyVal): MonthsTicker };
    export interface MonthsTicker extends SingleIntervalTicker {
        months: Array<Int>;
    }

    export var YearsTicker: { new(attributes?: KeyVal, options?: KeyVal): YearsTicker };
    export interface YearsTicker extends SingleIntervalTicker {}

    export var BasicTicker: { new(attributes?: KeyVal, options?: KeyVal): BasicTicker };
    export interface BasicTicker extends Ticker {}

    export var LogTicker: { new(attributes?: KeyVal, options?: KeyVal): LogTicker };
    export interface LogTicker extends AdaptiveTicker {}

    export var CategoricalTicker: { new(attributes?: KeyVal, options?: KeyVal): CategoricalTicker };
    export interface CategoricalTicker extends Ticker {}

    export var DatetimeTicker: { new(attributes?: KeyVal, options?: KeyVal): DatetimeTicker };
    export interface DatetimeTicker extends Ticker {}
}
