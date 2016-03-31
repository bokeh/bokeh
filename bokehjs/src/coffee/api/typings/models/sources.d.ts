declare namespace Bokeh {
    export interface DataSource extends Model {
        column_names?: Array<string>;
        selected?: Selected;
        callback?: Callback;
    }

    type Data = {[key: string]: ArrayLike<any>};

    export var ColumnDataSource: { new(attributes?: KeyVal, options?: KeyVal): ColumnDataSource };
    export interface ColumnDataSource extends DataSource {
        data?: Data;

        stream(new_data: Data, rollover: number): void;
    }

    export interface RemoteSource extends DataSource {
        data_url?: string;
        polling_interval?: Int;
    }

    export var AjaxDataSource: { new(attributes?: KeyVal, options?: KeyVal): AjaxDataSource };
    export interface AjaxDataSource extends RemoteSource {
        method?: HTTPMethod;
    }
}
