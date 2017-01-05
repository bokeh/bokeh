declare namespace Bokeh {
  export interface DataSource extends Model, IDataSource {}
  export interface IDataSource extends IModel {
    selected?: Selected;
    callback?: Callback | ((source: this) => void);
  }

  type Data = Map<ArrayLike<any>>;

  export interface ColumnarDataSource extends DataSource, IColumnarDataSource { };
  export interface IColumnarDataSource extends IDataSource {
    column_names?: Array<string>;
    inspected?: Selected;
  }

  export var ColumnDataSource: { new(attributes?: IColumnDataSource, options?: ModelOpts): ColumnDataSource };
  export interface ColumnDataSource extends ColumnarDataSource, IColumnDataSource {
    stream(new_data: Data, rollover: number): void;
  }
  export interface IColumnDataSource extends IColumnarDataSource {
    data?: Data;
  }

  export var GeoJSONDataSource: { new(attributes?: IGeoJSONDataSource, options?: ModelOpts): GeoJSONDataSource };
  export interface GeoJSONDataSource extends ColumnarDataSource, IGeoJSONDataSource {}
  export interface IGeoJSONDataSource extends IColumnarDataSource {
    geojson?: JsObj;
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
