declare namespace Bokeh {
    export interface Range extends Model {
        callback: Callback;
    }

    export var Range1d: {
        new(attributes?: KeyVal, options?: KeyVal): Range1d;
        (start: number, end: number): Range1d;
    }
    export interface Range1d extends Range {
        start: number;
        end: number;
        bounds: Auto | [number, number] /*| [Datetime, Datetime]*/;
    }

    export interface DataRange extends Range {
        names: Array<string>;
        renderers: Array<Renderer>;
    }

    export var DataRange1d: { new(attributes?: KeyVal, options?: KeyVal): DataRange1d };
    export interface DataRange1d extends DataRange {
        range_padding: number;

        start: number;
        end: number;

        bounds: Auto | [number, number];

        flipped: boolean;
        follow: StartEnd;
        follow_interval: number;
        default_span: number;
    }

    export var FactorRange: { new(attributes?: KeyVal, options?: KeyVal): FactorRange };
    export interface FactorRange extends Range {
        offset: number;
        factors: Array<string> | Array<Int>;
        bounds: Auto | Array<string> | Array<Int>;
    }
}
