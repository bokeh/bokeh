declare namespace Bokeh {
    export interface ImageSource extends Model {
        url: string;
        extra_url_vars: {[key: string]: string};
    }
}
