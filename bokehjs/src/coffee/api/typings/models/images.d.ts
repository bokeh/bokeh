declare namespace Bokeh {
    export var ImageSource: { new(attributes?: KeyVal, options?: KeyVal): ImageSource };
    export interface ImageSource extends Model {
        url: string;
        extra_url_vars: {[key: string]: string};
    }
}
