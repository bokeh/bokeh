declare namespace Bokeh {
    export interface Ticker extends Model {
        num_minor_ticks: Int;
        desired_num_ticks: Int;
    }

    export var FixedTicker: { new(): FixedTicker };
    export interface FixedTicker extends Ticker {
        ticks: Array<number>;
    }

    export var AdaptiveTicker: { new(): AdaptiveTicker };
    export interface AdaptiveTicker extends Ticker {
        base: number;
        mantissas: Array<number>;
        min_interval: number;
        max_interval: number;
    }

    export var CompositeTicker: { new(): CompositeTicker };
    export interface CompositeTicker extends Ticker {
        tickers: Array<Ticker>;
    }

    export var SingleIntervalTicker: { new(): SingleIntervalTicker };
    export interface SingleIntervalTicker extends Ticker {
        interval: number;
    }

    export var DaysTicker: { new(): DaysTicker };
    export interface DaysTicker extends SingleIntervalTicker {
        days: Array<Int>;
    }

    export var MonthsTicker: { new(): MonthsTicker };
    export interface MonthsTicker extends SingleIntervalTicker {
        months: Array<Int>;
    }

    export var YearsTicker: { new(): YearsTicker };
    export interface YearsTicker extends SingleIntervalTicker {}

    export var BasicTicker: { new(): BasicTicker };
    export interface BasicTicker extends Ticker {}

    export var LogTicker: { new(): LogTicker };
    export interface LogTicker extends AdaptiveTicker {}

    export var CategoricalTicker: { new(): CategoricalTicker };
    export interface CategoricalTicker extends Ticker {}

    export var DatetimeTicker: { new(): DatetimeTicker };
    export interface DatetimeTicker extends Ticker {}
}
