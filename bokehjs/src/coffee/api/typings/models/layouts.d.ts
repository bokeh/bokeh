declare namespace Bokeh {
    export interface Layout extends Component, ILayout {}
    export interface ILayout extends IComponent {
        width?: Int;
        height?: Int;
    }

    export interface BaseBox extends Layout, IBaseBox {}
    export interface IBaseBox extends ILayout {
        children?: Array<Component>;
    }

    export var HBox: { new(attributes?: IHBox, options?: ModelOpts): HBox };
    export interface HBox extends BaseBox, IHBox {}
    export interface IHBox extends IBaseBox {}

    export var VBox: { new(attributes?: IVBox, options?: ModelOpts): VBox };
    export interface VBox extends BaseBox, IVBox {}
    export interface IVBox extends IBaseBox {}
}
