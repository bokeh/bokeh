declare namespace Bokeh {
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

    export var LinearAxis: { new(attributes?: KeyVal, options?: KeyVal): LinearAxis };
    export interface LinearAxis extends ContinuousAxis {}

    export var LogAxis: { new(attributes?: KeyVal, options?: KeyVal): LogAxis };
    export interface LogAxis extends ContinuousAxis {}

    export var CategoricalAxis: { new(attributes?: KeyVal, options?: KeyVal): CategoricalAxis };
    export interface CategoricalAxis extends Axis {}

    export var DatetimeAxis: { new(attributes?: KeyVal, options?: KeyVal): DatetimeAxis };
    export interface DatetimeAxis extends LinearAxis {
        scale: string;
        num_labels: Int;
        char_width: Int;
        fill_ratio: number;
    }
}
