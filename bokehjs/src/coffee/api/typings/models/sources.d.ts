declare namespace Bokeh {
    export interface DataSource extends Model, IDataSource {}
    export interface IDataSource extends IModel {
        column_names?: Array<string>;
        selected?: Selected;
        inspected?: Selected;
        callback?: Callback | ((source: this) => void);
    }

    type Data = Map<ArrayLike<any>>;

    export var ColumnDataSource: { new(attributes?: IColumnDataSource, options?: ModelOpts): ColumnDataSource };
    export interface ColumnDataSource extends DataSource, IColumnDataSource {
        stream(new_data: Data, rollover: number): void;
    }
    export interface IColumnDataSource extends IDataSource {
        data?: Data;
    }

    export interface RemoteSource extends DataSource, IRemoteSource {}
    export interface IRemoteSource extends IDataSource {
        data_url?: string;
        polling_interval?: Int;
    }

    export var AjaxDataSource: { new(attributes?: IAjaxDataSource, options?: ModelOpts): AjaxDataSource };
    export interface AjaxDataSource extends RemoteSource, IAjaxDataSource {}
    export interface IAjaxDataSource extends IRemoteSource {
        method?: HTTPMethod;
    }
}
