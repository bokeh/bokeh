declare namespace Bokeh {
    export var ImageSource: { new(): ImageSource };
    export interface ImageSource extends Model {
        url: string;
        extra_url_vars: {[key: string]: string};
    }
}
