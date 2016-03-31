declare namespace Bokeh {
    export interface Layout extends Component {
        width?: Int;
        height?: Int;
    }

    export interface BaseBox extends Layout {
        children?: Array<Component>;
    }

    export var HBox: { new(attributes?: KeyVal, options?: KeyVal): HBox };
    export interface HBox extends BaseBox {}

    export var VBox: { new(attributes?: KeyVal, options?: KeyVal): VBox };
    export interface VBox extends BaseBox {}
}
