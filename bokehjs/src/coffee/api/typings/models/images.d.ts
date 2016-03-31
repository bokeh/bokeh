declare namespace Bokeh {
    export var ImageSource: { new(attributes?: IImageSource, options?: KeyVal): ImageSource };
    export interface ImageSource extends Model, IImageSource {}
    export interface IImageSource extends IModel {
        url?: string;
        extra_url_vars?: {[key: string]: string};
    }
}
