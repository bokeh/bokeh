declare namespace Bokeh {
    export interface TickFormatter extends Model, ITickFormatter {}
    export interface ITickFormatter extends IModel {}

    export var BasicTickFormatter: { new(attributes?: IBasicTickFormatter, options?: KeyVal): BasicTickFormatter };
    export interface BasicTickFormatter extends TickFormatter, IBasicTickFormatter {}
    export interface IBasicTickFormatter extends ITickFormatter {
        precision?: Auto | Int;
        use_scientific?: boolean;
        power_limit_high?: Int;
        power_limit_low?: Int;
    }

    export var LogTickFormatter: { new(attributes?: ILogTickFormatter, options?: KeyVal): LogTickFormatter };
    export interface LogTickFormatter extends TickFormatter, ILogTickFormatter {}
    export interface ILogTickFormatter extends ITickFormatter {}

    export var CategoricalTickFormatter: { new(attributes?: ICategoricalTickFormatter, options?: KeyVal): CategoricalTickFormatter };
    export interface CategoricalTickFormatter extends TickFormatter, ICategoricalTickFormatter {}
    export interface ICategoricalTickFormatter extends ITickFormatter {}

    export var DatetimeTickFormatter: { new(attributes?: IDatetimeTickFormatter, options?: KeyVal): DatetimeTickFormatter };
    export interface DatetimeTickFormatter extends TickFormatter, IDatetimeTickFormatter {}
    export interface IDatetimeTickFormatter extends ITickFormatter {
        formats?: {[key: string /*DatetimeUnits*/]: Array<string>};
    }

    export var NumeralTickFormatter: { new(attributes?: INumeralTickFormatter, options?: KeyVal): NumeralTickFormatter };
    export interface NumeralTickFormatter extends TickFormatter, INumeralTickFormatter {}
    export interface INumeralTickFormatter extends ITickFormatter {
        format?: string;
        language?: NumeralLanguage;
        rounding?: RoundingFunction;
    }

    export var PrintfTickFormatter: { new(attributes?: IPrintfTickFormatter, options?: KeyVal): PrintfTickFormatter };
    export interface PrintfTickFormatter extends TickFormatter, IPrintfTickFormatter {}
    export interface IPrintfTickFormatter extends ITickFormatter {
        format?: string;
    }
}
