declare namespace Bokeh {
export interface TickFormatter extends Model {}

export interface BasicTickFormatter extends TickFormatter {
    precision: Auto | Int;
    use_scientific: boolean;
    power_limit_high: Int;
    power_limit_low: Int;
}

export interface LogTickFormatter extends TickFormatter {}

export interface CategoricalTickFormatter extends TickFormatter {}

export interface DatetimeTickFormatter extends TickFormatter {
    /*
    formats: Map[DatetimeUnits, List[String]]];
    */
}

export interface NumeralTickFormatter extends TickFormatter {
    format: string;
    language: NumeralLanguage;
    rounding: RoundingFunction;
}

export interface PrintfTickFormatter extends TickFormatter {
    format: string;
}
}
