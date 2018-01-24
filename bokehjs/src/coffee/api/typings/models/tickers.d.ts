declare namespace Bokeh {
  export interface Ticker extends Model, ITicker {}
  export interface ITicker extends IModel {}

  export interface ContinuousTicker extends Ticker, IContinuousTicker {}
  export interface IContinuousTicker extends ITicker {
    num_minor_ticks?: Int;
    desired_num_ticks?: Int;
  }

  export const FixedTicker: { new(attributes?: IFixedTicker, options?: ModelOpts): FixedTicker };
  export interface FixedTicker extends ContinuousTicker, IFixedTicker {}
  export interface IFixedTicker extends IContinuousTicker {
    ticks?: number[];
  }

  export const AdaptiveTicker: { new(attributes?: IAdaptiveTicker, options?: ModelOpts): AdaptiveTicker };
  export interface AdaptiveTicker extends ContinuousTicker, IAdaptiveTicker {}
  export interface IAdaptiveTicker extends IContinuousTicker {
    base?: number;
    mantissas?: number[];
    min_interval?: number;
    max_interval?: number;
  }

  export const CompositeTicker: { new(attributes?: ICompositeTicker, options?: ModelOpts): CompositeTicker };
  export interface CompositeTicker extends ContinuousTicker, ICompositeTicker {}
  export interface ICompositeTicker extends IContinuousTicker {
    tickers?: Ticker[];
  }

  export const SingleIntervalTicker: { new(attributes?: ISingleIntervalTicker, options?: ModelOpts): SingleIntervalTicker };
  export interface SingleIntervalTicker extends ContinuousTicker, ISingleIntervalTicker {}
  export interface ISingleIntervalTicker extends IContinuousTicker {
    interval?: number;
  }

  export const DaysTicker: { new(attributes?: IDaysTicker, options?: ModelOpts): DaysTicker };
  export interface DaysTicker extends SingleIntervalTicker, IDaysTicker {}
  export interface IDaysTicker extends ISingleIntervalTicker {
    days?: Int[];
  }

  export const MonthsTicker: { new(attributes?: IMonthsTicker, options?: ModelOpts): MonthsTicker };
  export interface MonthsTicker extends SingleIntervalTicker, IMonthsTicker {}
  export interface IMonthsTicker extends ISingleIntervalTicker {
    months?: Int[];
  }

  export const YearsTicker: { new(attributes?: IYearsTicker, options?: ModelOpts): YearsTicker };
  export interface YearsTicker extends SingleIntervalTicker, IYearsTicker {}
  export interface IYearsTicker extends ISingleIntervalTicker {}

  export const BasicTicker: { new(attributes?: IBasicTicker, options?: ModelOpts): BasicTicker };
  export interface BasicTicker extends Ticker, IBasicTicker {}
  export interface IBasicTicker extends ITicker {}

  export const LogTicker: { new(attributes?: ILogTicker, options?: ModelOpts): LogTicker };
  export interface LogTicker extends AdaptiveTicker, ILogTicker {}
  export interface ILogTicker extends IAdaptiveTicker {}

  export const CategoricalTicker: { new(attributes?: ICategoricalTicker, options?: ModelOpts): CategoricalTicker };
  export interface CategoricalTicker extends Ticker, ICategoricalTicker {}
  export interface ICategoricalTicker extends ITicker {}

  export const DatetimeTicker: { new(attributes?: IDatetimeTicker, options?: ModelOpts): DatetimeTicker };
  export interface DatetimeTicker extends Ticker, IDatetimeTicker {}
  export interface IDatetimeTicker extends ITicker {}
}
