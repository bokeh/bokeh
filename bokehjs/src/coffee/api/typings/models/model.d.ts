declare namespace Bokeh {
  export interface IModel {
    id?: string;
    name?: string;
    tags?: any[];
  }
  export interface Model extends IModel {
    references(): Model[];

    select<T extends Model>(type: Class<T>): T[];
    select(name: string): Model[];

    select_one<T extends Model>(type: Class<T>): T;
    select_one(name: string): Model;
  }

  export interface ModelOpts {
    silent?: boolean;
    defer_initialization?: boolean;
  }
}
