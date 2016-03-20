declare namespace Bokeh {
    export interface Layout extends Component {
        width: Int;
        height: Int;
    }

    export interface BaseBox extends Layout {
        children: Array<Component>;
    }

    export var HBox: { new(): HBox };
    export interface HBox extends BaseBox {}

    export var VBox: { new(): VBox };
    export interface VBox extends BaseBox {}
}
