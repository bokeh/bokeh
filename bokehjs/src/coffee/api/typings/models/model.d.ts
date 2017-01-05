declare namespace Bokeh {
  export interface IModel {
    id?: string;
    name?: string;
    tags?: Array<any>;
  }
  export interface Model extends IModel {
    references(): Array<Model>;

    select<T extends Model>(type: Class<T>): Array<T>;
    select(name: string): Array<Model>;

    select_one<T extends Model>(type: Class<T>): T;
    select_one(name: string): Model;
  }

  export interface ModelOpts {
    silent?: boolean;
    defer_initialization?: boolean;
  }
}
