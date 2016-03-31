declare namespace Bokeh {
    export interface IModel {
        name?: string;
        tags?: Array<any>;
    }
    export interface Model extends IModel {}

    export interface ModelOpts {
        silent?: boolean;
        defer_initialization?: boolean;
    }
}
