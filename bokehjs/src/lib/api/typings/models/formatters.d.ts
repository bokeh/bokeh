declare namespace Bokeh {
  export interface TickFormatter extends Model, ITickFormatter {}
  export interface ITickFormatter extends IModel {}

  export const BasicTickFormatter: { new(attributes?: IBasicTickFormatter, options?: ModelOpts): BasicTickFormatter };
  export interface BasicTickFormatter extends TickFormatter, IBasicTickFormatter {}
  export interface IBasicTickFormatter extends ITickFormatter {
    precision?: Auto | Int;
    use_scientific?: boolean;
    power_limit_high?: Int;
    power_limit_low?: Int;
  }

  export const LogTickFormatter: { new(attributes?: ILogTickFormatter, options?: ModelOpts): LogTickFormatter };
  export interface LogTickFormatter extends TickFormatter, ILogTickFormatter {}
  export interface ILogTickFormatter extends ITickFormatter {}

  export const CategoricalTickFormatter: { new(attributes?: ICategoricalTickFormatter, options?: ModelOpts): CategoricalTickFormatter };
  export interface CategoricalTickFormatter extends TickFormatter, ICategoricalTickFormatter {}
  export interface ICategoricalTickFormatter extends ITickFormatter {}

  export const DatetimeTickFormatter: { new(attributes?: IDatetimeTickFormatter, options?: ModelOpts): DatetimeTickFormatter };
  export interface DatetimeTickFormatter extends TickFormatter, IDatetimeTickFormatter {}
  export interface IDatetimeTickFormatter extends ITickFormatter {
    microseconds?: string[];
    milliseconds?: string[];
    seconds?:      string[];
    minsec?:       string[];
    minutes?:      string[];
    hourmin?:      string[];
    hours?:        string[];
    days?:         string[];
    months?:       string[];
    years?:        string[];
  }

  export const FuncTickFormatter: { new(attributes?: IFuncTickFormatter, options?: ModelOpts): FuncTickFormatter };
  export interface FuncTickFormatter extends TickFormatter, IFuncTickFormatter {}
  export interface IFuncTickFormatter extends ITickFormatter {
    args?: Map<Model>;
    code?: string;
  }

  export const NumeralTickFormatter: { new(attributes?: INumeralTickFormatter, options?: ModelOpts): NumeralTickFormatter };
  export interface NumeralTickFormatter extends TickFormatter, INumeralTickFormatter {}
  export interface INumeralTickFormatter extends ITickFormatter {
    format?: string;
    language?: NumeralLanguage;
    rounding?: RoundingFunction;
  }

  export const PrintfTickFormatter: { new(attributes?: IPrintfTickFormatter, options?: ModelOpts): PrintfTickFormatter };
  export interface PrintfTickFormatter extends TickFormatter, IPrintfTickFormatter {}
  export interface IPrintfTickFormatter extends ITickFormatter {
    format?: string;
  }
}
