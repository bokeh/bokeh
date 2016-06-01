declare namespace Bokeh {
    export interface LayoutDOM extends Model, ILayoutDOM {}
    export interface ILayoutDOM extends IModel {
        width?: Int;
        height?: Int;
        disabled?: boolean;
    }

    export interface BaseBox extends LayoutDOM, IBaseBox {}
    export interface IBaseBox extends ILayoutDOM {
        children?: Array<LayoutDOM>;
    }

    export var HBox: { new(attributes?: IHBox, options?: ModelOpts): HBox };
    export interface HBox extends BaseBox, IHBox {}
    export interface IHBox extends IBaseBox {}

    export var VBox: { new(attributes?: IVBox, options?: ModelOpts): VBox };
    export interface VBox extends BaseBox, IVBox {}
    export interface IVBox extends IBaseBox {}
}
