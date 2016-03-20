declare namespace Bokeh {
    export interface TickFormatter extends Model {}

    export var BasicTickFormatter: { new(): BasicTickFormatter };
    export interface BasicTickFormatter extends TickFormatter {
        precision: Auto | Int;
        use_scientific: boolean;
        power_limit_high: Int;
        power_limit_low: Int;
    }

    export var LogTickFormatter: { new(): LogTickFormatter };
    export interface LogTickFormatter extends TickFormatter {}

    export var CategoricalTickFormatter: { new(): CategoricalTickFormatter };
    export interface CategoricalTickFormatter extends TickFormatter {}

    export var DatetimeTickFormatter: { new(): DatetimeTickFormatter };
    export interface DatetimeTickFormatter extends TickFormatter {
        /*
        formats: Map[DatetimeUnits, List[String]]];
        */
    }

    export var NumeralTickFormatter: { new(): NumeralTickFormatter };
    export interface NumeralTickFormatter extends TickFormatter {
        format: string;
        language: NumeralLanguage;
        rounding: RoundingFunction;
    }

    export var PrintfTickFormatter: { new(): PrintfTickFormatter };
    export interface PrintfTickFormatter extends TickFormatter {
        format: string;
    }
}
