declare namespace Bokeh {
    export interface DataSource extends Model {
        column_names: Array<string>;
        selected: Selected;
        callback: Callback;
    }

    export var ColumnDataSource: { new(attributes?: KeyVal, options?: KeyVal): ColumnDataSource };
    export interface ColumnDataSource extends DataSource {
        data: {[key: string]: ArrayLike<any>};
        stream(new_data: Object, rollover: Number): void;
    }

    export interface RemoteSource extends DataSource {
        data_url: String;
        polling_interval: Int;
    }

    export var AjaxDataSource: { new(attributes?: KeyVal, options?: KeyVal): AjaxDataSource };
    export interface AjaxDataSource extends RemoteSource {
        method: HTTPMethod;
    }
}
