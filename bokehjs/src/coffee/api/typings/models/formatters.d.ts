declare namespace Bokeh {
    export interface TickFormatter extends Model {}

    export var BasicTickFormatter: { new(attributes?: KeyVal, options?: KeyVal): BasicTickFormatter };
    export interface BasicTickFormatter extends TickFormatter {
        precision: Auto | Int;
        use_scientific: boolean;
        power_limit_high: Int;
        power_limit_low: Int;
    }

    export var LogTickFormatter: { new(attributes?: KeyVal, options?: KeyVal): LogTickFormatter };
    export interface LogTickFormatter extends TickFormatter {}

    export var CategoricalTickFormatter: { new(attributes?: KeyVal, options?: KeyVal): CategoricalTickFormatter };
    export interface CategoricalTickFormatter extends TickFormatter {}

    export var DatetimeTickFormatter: { new(attributes?: KeyVal, options?: KeyVal): DatetimeTickFormatter };
    export interface DatetimeTickFormatter extends TickFormatter {
        formats: {[key: string /*DatetimeUnits*/]: Array<string>};
    }

    export var NumeralTickFormatter: { new(attributes?: KeyVal, options?: KeyVal): NumeralTickFormatter };
    export interface NumeralTickFormatter extends TickFormatter {
        format: string;
        language: NumeralLanguage;
        rounding: RoundingFunction;
    }

    export var PrintfTickFormatter: { new(attributes?: KeyVal, options?: KeyVal): PrintfTickFormatter };
    export interface PrintfTickFormatter extends TickFormatter {
        format: string;
    }
}
