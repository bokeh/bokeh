declare namespace Bokeh {
    export interface DataSource extends Model {
        column_names: Array<string>;
        selected: Selected;
        callback: Callback;
    }

    export var ColumnDataSource: { new(): ColumnDataSource };
    export interface ColumnDataSource extends DataSource {
        data: {[key: string]: ArrayLike<any>};
    }

    export interface RemoteSource extends DataSource {
        data_url: String;
        polling_interval: Int;
    }

    export var AjaxDataSource: { new(): AjaxDataSource };
    export interface AjaxDataSource extends RemoteSource {
        method: HTTPMethod;
    }
}
