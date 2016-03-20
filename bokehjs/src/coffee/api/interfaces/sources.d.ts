import {Model} from "./model";
import {Selected} from "./selected";
import {Callback} from "./callbacks";
import {HTTPMethod} from "../enums";
import {Int} from "../types";

export interface DataSource extends Model {
    column_names: Array<string>;
    selected: Selected;
    callback: Callback;
}

export interface ColumnDataSource extends DataSource {
    data: {[key: string]: ArrayLike<any>};
}

export interface RemoteSource extends DataSource {
    data_url: String;
    polling_interval: Int;
}

export interface AjaxDataSource extends RemoteSource {
    method: HTTPMethod;
}
